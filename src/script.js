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
    this.todoItems.set(todoId, { title, checked: false });

    // Publish new todo items to the rest of the views
    this.publish("todo", "added");
  }

  toggleCompletionTodo({todoId, checked}) {
    // Update the item to checked in the map
    // TODO: Surely there is a cleaner way to do this! Spread operator?
    const todoAttrs = this.todoItems.get(todoId);
    todoAttrs.checked = checked;
    this.todoItems.set(todoId, todoAttrs);

    // Publish checked todo item to the rest of the views
    this.publish("todo", "toggledCompletion");
  }

  editTodo({todoId, title}) {
    const todoAttrs = this.todoItems.get(todoId);
    todoAttrs.title = title;
    this.todoItems.set(todoId, todoAttrs);

    // Refresh all views
    this.publish("todo", "edited");
  }

  deleteTodo({todoId}) {
    // Remove the item from the map
    this.todoItems.delete(todoId);
    // okay if already deleted

    // Refresh all views
    this.publish("todo", "deleted");
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

    // Subscribe to receive all new todos from the server
    this.subscribe("todo", "added", this.redraw);
    this.subscribe("todo", "toggledCompletion", this.redraw);
    this.subscribe("todo", "deleted", this.redraw);
    this.subscribe("todo", "edited", this.redraw);

    // When the enter key is pressed, add or edit the todo
    document.onkeydown = event => this.dispatchEnter(event);
  }

  redraw() {
    this.drawTodos(this.model.todoItems);
  }

  drawTodos(todoItems) {
    // Clear existing todos
    document.getElementById("todoList").innerHTML = "";

    // Add each todo item to the view
    todoItems.forEach((value, key) => {
      this.appendTodoItem(value.title, key, value.checked);
    });
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

    // Optimistic update
    this.appendTodoItem(title, this.model.todoIds + 1, false);

    // Publish event to the model, and by extension, all views, including ours
    this.publish("todo", "add", title);
  }

  todoCheckButtonClicked(event) {
    const todoCheckButton = event.target;
    const todoId = +todoCheckButton.parentNode.id;
    this.publish("todo", "toggleCompletion", { todoId, checked: event.target.checked });
  }

  editTodo(event) {
    const todoItem = event.target.parentNode;
    const todoId = +todoItem.id;
    const title = event.target.value;

    // Optimistic update
    todoItem.querySelector(".todoText").innerHTML = title;
    this.disableEditTodo(event);

    this.publish("todo", "edit", { todoId, title });
  }

  deleteTodo(event) {
    const todoItem = event.target.parentNode;
    const todoId = +todoItem.id;

    // Optimistic update
    todoItem.parentNode.removeChild(todoItem);

    this.publish("todo", "delete", { todoId });
  }

  enableEditTodo(event) {
    const todoItem = event.target.parentNode;
    const todoEdit = todoItem.querySelector(".todoEdit");

    // Hide the text
    const todoText = todoItem.querySelector(".todoText")
    todoText.hidden = true;

    // Show the input field
    todoEdit.hidden = false;
    todoEdit.setAttribute("contenteditable", "true");
    todoEdit.focus();
    todoEdit.addEventListener("blur", this.disableEditTodo);
  }

  disableEditTodo(event) {
    const todoItem = event.target.parentNode;
    const todoEdit = todoItem.querySelector(".todoEdit");
    todoEdit.hidden = true;

    const todoText = todoItem.querySelector(".todoText")
    todoText.hidden = false;
  }

  // Insert the todo item into the DOM
  appendTodoItem(title, todoId, checked) {
    const newTodoItem = document.createElement("li");
    newTodoItem.id = todoId;

    // Create the checkbox
    const todoCheckButton = document.createElement("input");
    todoCheckButton.type = "checkbox";
    todoCheckButton.className = "todoCheck";
    newTodoItem.appendChild(todoCheckButton);

    // Publish an event when the checkbox is clicked
    todoCheckButton.onclick = event => this.todoCheckButtonClicked(event);

    // Create the edit button
    const editTodoButton = document.createElement("span");
    editTodoButton.className = "editTodo";
    editTodoButton.onclick = event => this.enableEditTodo(event);
    newTodoItem.appendChild(editTodoButton);

    // Create the delete button
    const deleteTodoButton = document.createElement("span");
    deleteTodoButton.className = "deleteTodo";
    newTodoItem.appendChild(deleteTodoButton);

    // Publish an event when delete is clicked
    deleteTodoButton.onclick = event => this.deleteTodo(event);

    // Create the edit input field
    const editTodoValue = document.createElement("input");
    editTodoValue.className = "todoEdit";
    editTodoValue.setAttribute("contenteditable", "false");
    editTodoValue.hidden = true;
    editTodoValue.value = title;
    newTodoItem.appendChild(editTodoValue);

    // Create the title
    const todoTitle = document.createElement("span");
    todoTitle.className = "todoText"
    todoTitle.innerHTML = title;
    todoTitle.ondblclick = event => this.enableEditTodo(event);
    newTodoItem.appendChild(todoTitle);

    // Check the checkbox if the todo is checked
    if (checked) {
      todoCheckButton.checked = true;
      newTodoItem.className = "checked";
    }

    // Add to the DOM
    document.getElementById("todoList").appendChild(newTodoItem);
  }
}

Croquet.Session.join({
  appId: "in.jessmart.croquet.todo.example",
  apiKey: "1_bdoj07sd3kzujn95jhplk2pz8xuio3pbmxx3k7q6",
  name: Croquet.App.autoSession(),
  password: Croquet.App.autoPassword(),
  model: TodoList,
  view: TodoView
});
