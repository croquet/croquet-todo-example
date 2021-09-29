// Croquet Todo Example
// VanillaJS

// using prefixed names makes the code identical between
// importing Croquet as modulke or via <script> tag
// and matches our other docs
import * as Croquet from "@croquet/croquet";

class TodoList extends Croquet.Model {
  init() {
    this.todoItems = new Map();

    // Subscribe to receive new todo items
    this.subscribe("todo", "add", this.addTodo);
    this.subscribe("todo", "toggleCompletion", this.toggleCompletionTodo);
    this.subscribe("todo", "delete", this.deleteTodo);
    this.subscribe("todo", "edit", this.editTodo);
  }

  addTodo(todo) {
    // Add the new todo to the map
    const todoId = this.now();
    this.todoItems.set(`${todoId}`, { title: todo.title, checked: false });

    // Publish new todo items to the rest of the views
    this.publish("todo", "added");
  }

  toggleCompletionTodo(todo) {
    // Update the item to checked in the map
    // TODO: Surely there is a cleaner way to do this! Spread operator?
    const todoAttrs = this.todoItems.get(todo.id);
    todoAttrs.checked = todo.checked;
    this.todoItems.set(`${todo.id}`, todoAttrs);

    // Publish checked todo item to the rest of the views
    this.publish("todo", "toggledCompletion");
  }

  editTodo(todo) {
    const todoAttrs = this.todoItems.get(todo.id);
    todoAttrs.title = todo.title;
    this.todoItems.set(`${todo.id}`, todoAttrs);

    // Publish edited todo item to the rest of the views
    this.publish("todo", "edited");
  }

  deleteTodo(todo) {
    // Remove the item from the map
    this.todoItems.delete(todo.id);

    // Publish deleted todo item to the rest of the views
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

    // When the enter key is pressed, add the todo
    document.onkeydown = this.logKey.bind(this);
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

  logKey(event) {
    const newTodoValue = document.getElementById("newTodoValue");

    if (newTodoValue.focus && newTodoValue.value != "" && event.code === "Enter") {
      this.addTodo(event);
    }

    if (event.target.className == "todoEdit" && event.code === "Enter") {
      this.editTodo(event);
    }
  }

  addTodo(event) {
    const newTodo = document.getElementById("newTodoValue");
    const newTodoValue = newTodo.value;
    if (newTodoValue == "") { return; }

    // Clear the input field
    newTodo.value = "";

    // Optimistic update
    this.appendTodoItem(newTodoValue, this.now(), false);

    // Publish events to the model, and by extension, other views
    this.publish("todo", "add", { title: newTodoValue });
  }

  toggleCompletionTodo(event) {
    const todoItem = event.target;
    const todoId = todoItem.parentNode.id;
    this.publish("todo", "toggleCompletion", { id: todoId, checked: event.target.checked });
  }

  editTodo(event) {
    const todoItem = event.target.parentNode;
    const todoId = todoItem.id;
    const updatedTodoValue = event.target.value;

    // Optimistic update
    todoItem.querySelector(".todoText").innerHTML = updatedTodoValue;
    this.disableEditTodo(event);

    this.publish("todo", "edit", { id: todoId, title: updatedTodoValue });
  }

  deleteTodo(event) {
    const todoItem = event.target.parentNode;
    const todoId = todoItem.id;

    // Optimistic update
    todoItem.parentNode.removeChild(todoItem);

    this.publish("todo", "delete", { id: todoId });
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
    todoCheckButton.onclick = event => this.toggleCompletionTodo(event);

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
  name: "todo-session",
  password: "secret",
  debug: "sends",
  model: TodoList,
  view: TodoView
});
