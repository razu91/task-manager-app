import { useState } from "react";
import { useDispatch } from "react-redux";
import { addTask } from "../redux/taskSlice";
import axios from "axios";
import { useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import toast from "react-hot-toast";

function TaskForm() {
  const [task, setTask] = useState({ name: "", description: "", status: "To Do", due_date: "" });
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("http://127.0.0.1:8000/api/tasks", task);
      dispatch(addTask(response.data));
      toast.success("Task added successfully!");
      navigate("/");
    } catch (error) {
      toast.error("Error adding task");
      console.error("Error adding task:", error);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg mt-6">
      <h2 className="text-2xl font-semibold text-gray-700 text-center mb-4">Add Task</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="task-name">Task Name</Label>
          <Input
            type="text"
            id="task-name"
            placeholder="Enter task name"
            value={task.name}
            onChange={(e) => setTask({ ...task, name: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="task-description">Description</Label>
          <Textarea
            id="task-description"
            placeholder="Describe the task"
            value={task.description}
            onChange={(e) => setTask({ ...task, description: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="task-status">Status</Label>
          <select
            id="task-status"
            className="border p-2 w-full rounded-md"
            value={task.status}
            onChange={(e) => setTask({ ...task, status: e.target.value })}
          >
            <option>To Do</option>
            <option>In Progress</option>
            <option>Done</option>
          </select>
        </div>
        <div>
          <Label htmlFor="due-date">Due Date</Label>
          <Input
            type="date"
            id="due-date"
            value={task.due_date}
            onChange={(e) => setTask({ ...task, due_date: e.target.value })}
            required
          />
        </div>
        <Button type="submit" className="w-full bg-blue-500 hover:bg-blue-600">
          Add Task
        </Button>
      </form>
    </div>
  );
}

export default TaskForm;