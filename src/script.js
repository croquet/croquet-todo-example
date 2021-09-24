// Croquet Todo Example
// VanillaJS
import { Model, View, Session } from "@croquet/croquet";

class TodoList extends Model {
  init() {
    this.todoItems = new Map();

    // Subscribe to receive new todo items
    this.subscribe("todo", "add", this.todoAdded);
    this.subscribe("todo", "checkClick", this.todoCheckClicked);
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
}

// Could this line be simpler? 
// Haven't I already registered the model in the `Session.join`?
TodoList.register("TodoList");

class TodoView extends View {
  constructor(model) {
    super(model);
    // Remove any existing todo items to prevent a double-draw!
    document.getElementById("todoList").innerHTML = "";

    // Add existing todo items to the view
    model.todoItems.forEach((value, key) => {
      this.appendTodoItem(value.title, key);
    });

    // Register the click handlers
    const addTodoButton = document.getElementById("addTodo");
    addTodoButton.onclick = event => this.addTodoItem(event);

    // Subscribe to receive all new todos from the server
    this.subscribe("todo", "added", this.handleTodoAdded);
    this.subscribe("todo", "checkClicked", this.handleCheckClicked);

    document.onkeydown = this.logKey.bind(this);
  }

  logKey(event) {
    const newTodoValue = document.getElementById("newTodoValue");

    if (!newTodoValue.focus) {
      return;
    }

    if (newTodoValue.value != "" && event.code === "Enter") {
      console.log(this);
      this.addTodoItem(event);
    }
  }

  addTodoItem(event) {
    const newTodo = document.getElementById("newTodoValue");
    // Get the title of the new todo that was just created
    const newTodoValue = newTodo.value;
    newTodo.value = "";

    // Publish events to the model, and by extension, other views
    this.publish("todo", "add", { title: newTodoValue });
  }

  handleTodoAdded(todo) {
    this.appendTodoItem(todo.title, todo.id);
  }

  todoCheckClicked(event) {
    const todoItem = event.target;
    const todoId = todoItem.parentNode.id;
    this.publish("todo", "checkClick", { id: todoId, checked: event.target.checked });
    event.preventDefault();
  }

  handleCheckClicked(todo) {
    const todoItem = document.getElementById(todo.id);
    const checkbox = todoItem.getElementsByClassName("todoCheck")[0];
    checkbox.checked = todo.checked;
    todoItem.className = todo.checked ? "checked" : "";
  }

  // Insert the todo item into the DOM
  appendTodoItem(title, todoId) {
    const newTodoItem = document.createElement("li");
    newTodoItem.id = todoId;

    // Create the checkbox
    const todoCheckButton = document.createElement("input");
    todoCheckButton.type = "checkbox";
    todoCheckButton.className = "todoCheck";
    newTodoItem.appendChild(todoCheckButton);

    // Create the delete button
    const deleteTodoButton = document.createElement("input");
    deleteTodoButton.type = "button";
    deleteTodoButton.className = "deleteTodo";
    newTodoItem.appendChild(deleteTodoButton);

    // Publish an event when the checkbox is clicked
    todoCheckButton.onclick = event => this.todoCheckClicked(event);

    // Create the label
    newTodoItem.appendChild(document.createTextNode(title));

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
