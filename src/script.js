// Croquet Todo Example
import { Model, View, Session } from "@croquet/croquet";

class TodoList extends Model {
  init() {
    this.todoItems = new Map();

    // Subscribe to receive new todo items
    this.subscribe("todo", "add", this.todoAdded);
  }

  todoAdded(todo) {
    this.todoItems.set(this.now(), todo.title);
    // Publish new todo items to the rest of the views
    this.publish("todo", "added", { title: todo.title });
  }
}

TodoList.register("TodoList");

class TodoView extends View {
  constructor(model) {
    super(model);
    // Add existing todo items to the view
    model.todoItems.forEach(element => {
      this.appendTodoItem(element);
    });

    // Register the click handler
    const addTodoButton = document.getElementById("addTodo");
    addTodoButton.onclick = event => this.addTodoItem(event);

    // Subscribe to receive new todos from the server
    this.subscribe("todo", "added", this.handleTodoAdded);
  }

  addTodoItem(event) {
    // Get the title of the new todo that was just created
    const newTodoValue = document.getElementById("newTodoValue").value;
    // Publish events to the server
    this.publish("todo", "add", { title: newTodoValue });
  }

  handleTodoAdded(todo) {
    // Add the new todo to the view
    this.appendTodoItem(todo.title);
  }

  appendTodoItem(title) {
    const newTodoItem = document.createElement("li");
    newTodoItem.appendChild(document.createTextNode(title));
    document.getElementById("todoList").appendChild(newTodoItem);
  }
}

Session.join({
  appId: "in.jessmart.croquet.todo.example",
  apiKey: "1_bdoj07sd3kzujn95jhplk2pz8xuio3pbmxx3k7q6",
  name: "todo-session",
  password: "secret",
  debug: "sends,messages",
  model: TodoList,
  view: TodoView
});
