// Croquet Todo Example
// VanillaJS
import { Model, View, Session } from "@croquet/croquet";

class TodoList extends Model {
  init() {
    this.todoItems = new Map();

    // Subscribe to receive new todo items
    this.subscribe("todo", "add", this.todoAdded);
    this.subscribe("todo", "checkClick", this.todoCheckClicked);
    this.subscribe("todo", "deleteClick", this.todoDeleteClicked);
  }

  todoAdded(todo) {
    // Add the new todo to the map
    const todoId = this.now();
    this.todoItems.set(`${todoId}`, { title: todo.title, checked: false });

    // Publish new todo items to the rest of the views
    this.publish("todo", "added", { title: todo.title, id: todoId });
  }

  todoCheckClicked(todo) {
    // Update the item to checked in the map
    // TODO: Surely there is a cleaner way to do this! Spread operator?
    const todoAttrs = this.todoItems.get(todo.id);
    todoAttrs.checked = todo.checked;
    this.todoItems.set(`${todo.id}`, todoAttrs);

    // Publish checked todo item to the rest of the views
    this.publish("todo", "checkClicked", { id: todo.id, checked: todo.checked });
  }

  todoDeleteClicked(todo) {
    // Remove the item from the map
    this.todoItems.delete(todo.id);

    // Publish deleted todo item to the rest of the views
    this.publish("todo", "deleted", { id: todo.id });
  }
}

// Could this line be simpler? 
// Haven't I already registered the model in the `Session.join`?
TodoList.register("TodoList");

class TodoView extends View {
  model = this.wellKnownModel("modelRoot");

  constructor(model) {
    super(model);

    this.drawTodos(model.todoItems);

    // Register the click handlers
    const addTodoButton = document.getElementById("addTodo");
    addTodoButton.onclick = event => this.addTodoItem(event);
    const deleteButtons = document.getElementsByClassName("deleteTodo");
    for (let i = 0; i < deleteButtons.length; i++) {
      deleteButtons[i].onclick = event => this.deleteTodoItem(event);
    }

    // Subscribe to receive all new todos from the server
    this.subscribe("todo", "added", this.handleTodoAdded);
    this.subscribe("todo", "checkClicked", this.handleCheckClicked);
    this.subscribe("todo", "deleted", this.handleTodoDeleted);

    document.onkeydown = this.logKey.bind(this);
  }

  drawTodos(todoItems) {
    // Remove any existing todo items to prevent a double-draw!
    document.getElementById("todoList").innerHTML = "";

    // Add existing todo items to the view
    todoItems.forEach((value, key) => {
      this.appendTodoItem(value.title, key, value.checked);
    });
  }

  logKey(event) {
    const newTodoValue = document.getElementById("newTodoValue");

    if (newTodoValue.focus && newTodoValue.value != "" && event.code === "Enter") {
      this.addTodoItem(event);
    }
  }

  addTodoItem(event) {
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

  handleTodoAdded(todo) {
    this.drawTodos(this.model.todoItems);
  }

  todoCheckClicked(event) {
    const todoItem = event.target;
    const todoId = todoItem.parentNode.id;
    this.publish("todo", "checkClick", { id: todoId, checked: event.target.checked });
  }

  handleCheckClicked(todo) {
    this.drawTodos(this.model.todoItems);
  }

  deleteTodoItem(event) {
    const todoItem = event.target.parentNode;
    const todoId = todoItem.id;

    // Optimistic update
    todoItem.parentNode.removeChild(todoItem);

    this.publish("todo", "deleteClick", { id: todoId });
  }

  handleTodoDeleted(todo) {
    this.drawTodos(this.model.todoItems);
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
    todoCheckButton.onclick = event => this.todoCheckClicked(event);

    // Create the delete button
    const deleteTodoButton = document.createElement("span");
    deleteTodoButton.className = "deleteTodo";
    newTodoItem.appendChild(deleteTodoButton);

    // Publish an event when delete is clicked
    deleteTodoButton.onclick = event => this.deleteTodoItem(event);

    // Create the label
    newTodoItem.appendChild(document.createTextNode(title));

    // Check the checkbox if the todo is checked
    if (checked) {
      todoCheckButton.checked = true;
      newTodoItem.className = "checked";
    }

    // Add to the DOM
    document.getElementById("todoList").appendChild(newTodoItem);
  }
}

Session.join({
  appId: "in.jessmart.croquet.todo.example",
  apiKey: "1_bdoj07sd3kzujn95jhplk2pz8xuio3pbmxx3k7q6",
  name: "todo-session",
  password: "secret",
  debug: "sends",
  model: TodoList,
  view: TodoView
});
