// Croquet Todo Example
// VanillaJS

// using prefixed names makes the code identical between
// importing Croquet as module or via <script> tag
// and matches our other docs
import * as Croquet from "@croquet/croquet";

class TodoList extends Croquet.Model {
  init() {
    // auto-incrementing ids
    this.todoIds = 0;
    this.todoItems = new Map();

    // Subscribe to receive new todo items
    this.subscribe("todo", "add", this.addTodo);
    this.subscribe("todo", "toggleCompletion", this.toggleCompletionTodo);
    this.subscribe("todo", "delete", this.deleteTodo);
    this.subscribe("todo", "edit", this.editTodo);
  }

  addTodo(title) {
    // Add the new todo to the map
    const todoId = ++this.todoIds;
    const todoItem = { todoId, title, checked: false };
    this.todoItems.set(todoId, todoItem);

    // Refresh all views
    this.publish("todo", "changed");
  }

  toggleCompletionTodo({todoId, checked}) {
    // Update checked status of item in the map
    const todoItem = this.todoItems.get(todoId);
    if (!todoItem) { return; } // might have been deleted
    todoItem.checked = checked;

    // Refresh all views
    this.publish("todo", "changed");
  }

  editTodo({todoId, title}) {
    const todoItem = this.todoItems.get(todoId);
    if (!todoItem) { return; } // might have been deleted
    todoItem.title = title;

    // Refresh all views
    this.publish("todo", "changed");
  }

  deleteTodo({todoId}) {
    // Remove the item from the map
    this.todoItems.delete(todoId);
    // okay if already deleted

    // Refresh all views
    this.publish("todo", "changed");
  }
}

TodoList.register("TodoList");

class TodoView extends Croquet.View {
  model = this.wellKnownModel("modelRoot");

  constructor(model) {
    super(model);

    this.redraw();

    // Register click handlers for add todo button
    const addTodoButton = document.getElementById("addTodo");
    addTodoButton.onclick = event => this.addTodo(event);

    // Redraw list if todos changed
    this.subscribe("todo", "changed", this.redraw);

    // When the enter key is pressed, add or edit the todo
    document.onkeydown = event => this.dispatchEnter(event);
  }

  redraw(locallyAddedItem = null) {
    const todoArray = [...this.model.todoItems.values()];

    // for optimistic local update
    if (locallyAddedItem) todoArray.push(locallyAddedItem);

    // sort by completion status and id
    const sorted = todoArray.sort((a, b) => {
      if (a.checked !== b.checked) return a.checked - b.checked;
      return a.todoId - b.todoId;
    })

    // Clear existing todos
    document.getElementById("todoList").innerHTML = "";

    // Add each todo item to the view
    for (const {todoId, title, checked} of sorted) {
      this.appendTodoItem(title, todoId, checked);
    }
  }

  dispatchEnter(event) {
    const newTodo = document.getElementById("newTodo");

    if (newTodo.focus && newTodo.value !== "" && event.code === "Enter") {
      this.addTodo(event);
    }

    if (event.target.className === "todoEdit" && event.code === "Enter") {
      this.editTodo(event);
    }
  }

  addTodo() {
    const title = document.getElementById("newTodo").value;
    if (title === "") { return; }

    // Clear the input field
    newTodo.value = "";

    // Optimistic local update
    this.redraw({ todoId: Infinity, title, checked: false });

    // Publish event to the model, and by extension, all views, including ours
    this.publish("todo", "add", title);
  }

  todoCheckButtonClicked(event) {
    const todoCheckButton = event.target;
    const todoId = +todoCheckButton.parentNode.id;
    const checked = todoCheckButton.checked;
    this.publish("todo", "toggleCompletion", { todoId, checked });
  }

  editTodo(event) {
    const todoElement = event.target.parentNode;
    const todoId = +todoElement.id;
    const title = event.target.value;

    // Optimistic update
    todoElement.querySelector(".todoText").innerHTML = title;
    this.disableEditTodo(event);

    this.publish("todo", "edit", { todoId, title });
  }

  deleteTodo(event) {
    const todoElement = event.target.parentNode;
    const todoId = +todoElement.id;

    // Optimistic update
    todoElement.parentNode.removeChild(todoElement);

    this.publish("todo", "delete", { todoId });
  }

  enableEditTodo(event) {
    const todoElement = event.target.parentNode;
    const todoEdit = todoElement.querySelector(".todoEdit");

    // Hide the text
    const todoText = todoElement.querySelector(".todoText")
    todoText.hidden = true;

    // Show the input field
    todoEdit.hidden = false;
    todoEdit.setAttribute("contenteditable", "true");
    todoEdit.focus();
    todoEdit.addEventListener("blur", this.disableEditTodo);
  }

  disableEditTodo(event) {
    const todoElement = event.target.parentNode;
    const todoEdit = todoElement.querySelector(".todoEdit");
    todoEdit.hidden = true;

    const todoText = todoElement.querySelector(".todoText")
    todoText.hidden = false;
  }

  // Insert the todo item into the DOM
  appendTodoItem(title, todoId, checked) {
    const todoElement = document.createElement("li");
    todoElement.id = todoId;

    // Create the checkbox
    const todoCheckButton = document.createElement("input");
    todoCheckButton.type = "checkbox";
    todoCheckButton.className = "todoCheck";
    todoElement.appendChild(todoCheckButton);

    // Publish an event when the checkbox is clicked
    todoCheckButton.onclick = event => this.todoCheckButtonClicked(event);

    // Create the edit button
    const editTodoButton = document.createElement("span");
    editTodoButton.className = "editTodo";
    editTodoButton.onclick = event => this.enableEditTodo(event);
    todoElement.appendChild(editTodoButton);

    // Create the delete button
    const deleteTodoButton = document.createElement("span");
    deleteTodoButton.className = "deleteTodo";
    todoElement.appendChild(deleteTodoButton);

    // Publish an event when delete is clicked
    deleteTodoButton.onclick = event => this.deleteTodo(event);

    // Create the edit input field
    const editTodoValue = document.createElement("input");
    editTodoValue.className = "todoEdit";
    editTodoValue.setAttribute("contenteditable", "false");
    editTodoValue.hidden = true;
    editTodoValue.value = title;
    todoElement.appendChild(editTodoValue);

    // Create the title
    const todoTitle = document.createElement("span");
    todoTitle.className = "todoText"
    todoTitle.innerHTML = title;
    todoTitle.ondblclick = event => this.enableEditTodo(event);
    todoElement.appendChild(todoTitle);

    // Check the checkbox if the todo is checked
    if (checked) {
      todoCheckButton.checked = true;
      todoElement.className = "checked";
    }

    // Add to the DOM
    document.getElementById("todoList").appendChild(todoElement);
  }
}

Croquet.App.makeWidgetDock();

Croquet.Session.join({
  appId: "in.jessmart.croquet.todo.example",
  apiKey: "1_bdoj07sd3kzujn95jhplk2pz8xuio3pbmxx3k7q6",
  name: Croquet.App.autoSession(),
  password: Croquet.App.autoPassword(),
  model: TodoList,
  view: TodoView
});
