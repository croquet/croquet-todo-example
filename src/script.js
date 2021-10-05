// Croquet Todo Example
// VanillaJS

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

  addTodo({ title }) {
    // Add the new todo to the map
    const todoId = ++this.todoIds;
    const todoItem = { todoId, title, checked: false };
    this.todoItems.set(todoId, todoItem);

    // Refresh all views
    this.publish("todo", "added", { todoId: todoId, title: title });
  }

  toggleCompletionTodo({ todoId, checked }) {
    // Update checked status of item in the map
    const todoItem = this.todoItems.get(todoId);
    if (!todoItem) return; // might have been deleted
    todoItem.checked = checked;

    // Refresh all views
    this.publish("todo", "toggledCompletion", { todoId: todoId, checked: checked });
  }

  editTodo({ todoId, title }) {
    const todoItem = this.todoItems.get(todoId);
    if (!todoItem) return; // might have been deleted
    todoItem.title = title;

    // Refresh all views
    this.publish("todo", "edited", { todoId: todoId, title: title });
  }

  deleteTodo({ todoId }) {
    // Remove the item from the map
    this.todoItems.delete(todoId);
    // okay if already deleted

    // Refresh all views
    this.publish("todo", "deleted", { todoId: todoId });
  }
}

TodoList.register("TodoList");

class TodoView extends Croquet.View {
  constructor(model) {
    super(model);
    this.model = model;

    this.drawTodos();

    // Register click handlers for add todo button
    const addTodoButton = document.getElementById("addTodo");
    addTodoButton.onclick = event => this.addTodo(event);

    this.subscribe("todo", "added", this.addedTodo);
    this.subscribe("todo", "toggledCompletion", this.toggledTodoCompletion);
    this.subscribe("todo", "deleted", this.deletedTodo);
    this.subscribe("todo", "edited", this.editedTodo);

    // When the enter key is pressed, add or edit the todo
    document.onkeydown = event => this.dispatchEnter(event);
  }

  drawTodos() {
    const todoArray = [...this.model.todoItems.values()];

    // sort by id
    todoArray.sort((a, b) => a.todoId - b.todoId);

    // Clear any existing todos
    document.getElementById("todoList").innerHTML = "";

    // Add each todo item to the view
    for (const item of todoArray) {
      this.appendTodoItem(item);
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
    if (!title) return;
    newTodo.value = "";

    this.publish("todo", "add", { title });
  }

  addedTodo({ todoId, title }) {
    this.appendTodoItem({ todoId, title, checked: false });
  }

  toggleTodoCompletion(event) {
    const todoCheckButton = event.target;
    const todoId = +todoCheckButton.parentNode.id;
    this.publish("todo", "toggleCompletion", { todoId, checked: todoCheckButton.checked });
    event.preventDefault();
  }

  toggledTodoCompletion({ todoId, checked }) {
    const todoElement = document.getElementById(todoId);
    todoElement.className = checked ? "checked" : "";
    const todoCheckButton = todoElement.querySelector("input");

    todoCheckButton.checked = checked;
  }

  editTodo(event) {
    const todoElement = event.target.parentNode;
    const todoId = +todoElement.id;
    const title = event.target.value;
    if (!title) this.deleteTodo(event);

    this.toggleEditTodo(event, false);

    this.publish("todo", "edit", { todoId, title });
  }

  editedTodo({ todoId, title }) {
    const todoElement = document.getElementById(todoId);
    todoElement.querySelector(".todoText").innerText = title;
  }

  deleteTodo(event) {
    const todoElement = event.target.parentNode;
    const todoId = +todoElement.id;

    this.publish("todo", "delete", { todoId });
  }

  deletedTodo({ todoId }) {
    const todoElement = document.getElementById(todoId);
    todoElement.parentElement.removeChild(todoElement);
  }

  toggleEditTodo(event, editing) {
    const todoElement = event.target.parentNode;
    const todoEdit = todoElement.querySelector(".todoEdit");
    const todoText = todoElement.querySelector(".todoText")

    todoText.hidden = editing;
    todoEdit.hidden = !editing;
    if (editing) todoEdit.focus();
  }

  enableEditTodo(event) { this.toggleEditTodo(event, true); }
  disableEditTodo(event) { this.toggleEditTodo(event, false); }

  // Insert the todo item into the DOM
  appendTodoItem({ title, todoId, checked }) {
    // create element itself
    const todoElement = document.createElement("li");
    todoElement.id = todoId;
    if (checked) todoElement.className = "checked";

    // create inner elements
    todoElement.innerHTML = `
      <input type="checkbox" class="todoCheck" ${checked ? 'checked' : ''}>
      <span class="editTodo"></span>
      <span class="deleteTodo"></span>
      <span class="todoText">${title}</span>
      <input class="todoEdit" hidden="true">
    `;
    todoElement.querySelector(".todoEdit").value = title;

    // register event handlers
    todoElement.querySelector(".todoCheck").onclick = event => this.toggleTodoCompletion(event);
    todoElement.querySelector(".editTodo").onclick = event => this.enableEditTodo(event);
    todoElement.querySelector(".deleteTodo").onclick = event => this.deleteTodo(event);
    todoElement.querySelector(".todoText").ondblclick = event => this.enableEditTodo(event);
    todoElement.querySelector(".todoEdit").onblur = event => this.disableEditTodo(event);

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
