// Croquet Todo Example
// VanillaJS

import * as Croquet from "@croquet/croquet";

class TodoList extends Croquet.Model {
  init() {
    this.todoIds = 0; // auto-incrementing todo IDs
    this.todoItems = new Map();

    this.subscribe("todo-list", "add-todo", this.addTodo);
    this.subscribe("todo-list", "toggle-completion-todo", this.toggleCompletionTodo);
    this.subscribe("todo-list", "delete-todo", this.deleteTodo);
    this.subscribe("todo-list", "edit-todo", this.editTodo);
  }

  addTodo({ title }) {
    const todoId = ++this.todoIds;
    const todoItem = { todoId, title, checked: false };
    this.todoItems.set(todoId, todoItem);

    this.publish("todo-list", "added-todo", { todoId: todoId, title: title });
  }

  toggleCompletionTodo({ todoId, checked }) {
    const todoItem = this.todoItems.get(todoId);
    if (!todoItem) return; // might have been deleted
    todoItem.checked = checked;

    this.publish("todo-list", "toggled-completion-todo", { todoId: todoId, checked: checked });
  }

  editTodo({ todoId, title }) {
    const todoItem = this.todoItems.get(todoId);
    if (!todoItem) return; // might have been deleted
    todoItem.title = title;

    this.publish("todo-list", "edited-todo", { todoId: todoId, title: title });
  }

  deleteTodo({ todoId }) {
    this.todoItems.delete(todoId); // okay if already deleted

    this.publish("todo-list", "deleted-todo", { todoId: todoId });
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
    addTodoButton.onclick = event => this.onAddTodo(event);

    this.subscribe("todo-list", "added-todo", this.addedTodo);
    this.subscribe("todo-list", "toggled-completion-todo", this.toggledCompletionTodo);
    this.subscribe("todo-list", "deleted-todo", this.deletedTodo);
    this.subscribe("todo-list", "edited-todo", this.editedTodo);

    // When the enter key is pressed, add or edit the todo
    document.onkeydown = event => this.onEnterPress(event);
  }

  drawTodos() {
    const todoArray = [...this.model.todoItems.values()];

    // sort by id
    todoArray.sort((a, b) => a.todoId - b.todoId);

    // Clear any existing todos
    document.getElementById("todoList").innerHTML = "";

    // Add each todo item to the view
    for (const item of todoArray) {
      this.appendTodoElement(item);
    }
  }

  onEnterPress(event) {
    const newTodo = document.getElementById("newTodo");

    if (newTodo.focus && newTodo.value !== "" && event.code === "Enter") {
      this.onAddTodo(event);
    }

    if (event.target.className === "todoEdit" && event.code === "Enter") {
      this.onEditTodo(event);
    }
  }

  onAddTodo() {
    const title = document.getElementById("newTodo").value;
    if (!title) return;
    newTodo.value = "";

    this.publish("todo-list", "add-todo", { title });
  }

  addedTodo({ todoId, title }) {
    this.appendTodoElement({ todoId, title, checked: false });
  }

  onTodoToggleCompletion(event) {
    const todoCheckButton = event.target;
    const todoId = +todoCheckButton.parentNode.id;
    this.publish("todo-list", "toggle-completion-todo", { todoId, checked: todoCheckButton.checked });
    event.preventDefault();
  }

  toggledCompletionTodo({ todoId, checked }) {
    const todoElement = document.getElementById(todoId);
    todoElement.className = checked ? "checked" : "";
    const todoCheckButton = todoElement.querySelector("input");

    todoCheckButton.checked = checked;
  }

  onEditTodo(event) {
    const todoElement = event.target.parentNode;
    const title = event.target.value;
    if (!title) this.onDeleteTodo(event);

    this.toggleEditTodo(event, false);

    this.publish("todo-list", "edit-todo", { todoId: +todoElement.id, title });
  }

  editedTodo({ todoId, title }) {
    const todoElement = document.getElementById(todoId);
    todoElement.querySelector(".todoText").innerText = title;
  }

  onDeleteTodo(event) {
    const todoElement = event.target.parentNode;

    this.publish("todo-list", "delete-todo", { todoId: +todoElement.id });
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

  onEnableEditTodo(event) { this.toggleEditTodo(event, true); }
  onDisableEditTodo(event) { this.toggleEditTodo(event, false); }

  appendTodoElement({ title, todoId, checked }) {
    const todoElement = document.createElement("li");
    todoElement.id = todoId;
    if (checked) todoElement.className = "checked";

    todoElement.innerHTML = `
      <input type="checkbox" class="todoCheck" ${checked ? 'checked' : ''}>
      <span class="editTodo"></span>
      <span class="deleteTodo"></span>
      <span class="todoText">${title}</span>
      <input class="todoEdit" hidden="true">
    `;
    todoElement.querySelector(".todoEdit").value = title;

    todoElement.querySelector(".todoCheck").onclick = event => this.onTodoToggleCompletion(event);
    todoElement.querySelector(".editTodo").onclick = event => this.onEnableEditTodo(event);
    todoElement.querySelector(".deleteTodo").onclick = event => this.onDeleteTodo(event);
    todoElement.querySelector(".todoText").ondblclick = event => this.onEnableEditTodo(event);
    todoElement.querySelector(".todoEdit").onblur = event => this.onDisableEditTodo(event);

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
