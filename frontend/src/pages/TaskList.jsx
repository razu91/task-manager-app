import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setTasks, deleteTask } from "../redux/taskSlice";
import axios from "axios";
import { Button } from "@/components/ui/button";  // Import ShadCN button
import { Dialog, DialogTrigger, DialogContent, DialogTitle } from "@/components/ui/dialog"; // Import modal
import toast from "react-hot-toast";

function TaskList() {
  const dispatch = useDispatch();
  const tasks = useSelector(state => state.tasks.list);
  const [selectedTask, setSelectedTask] = useState(null);
  const [loading, setLoading] = useState(true);

  console.log(tasks);
  
  // useEffect(() => {
  //   axios.get("http://127.0.0.1:8000/api/tasks")
  //     .then(response => dispatch(setTasks(response.data)))
  //     .catch(error => console.error("Error fetching tasks:", error));
  // }, [dispatch]);

  useEffect(() => {
    axios.get("http://127.0.0.1:8000/api/tasks")
      .then(response => {
        dispatch(setTasks(response.data));
        setLoading(false);
      })
      .catch(error => {
        console.error("Error fetching tasks:", error);
        setLoading(false);
      });
  }, [dispatch]);

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }
  const handleDelete = async () => {
    try {
      await axios.delete(`http://127.0.0.1:8000/api/tasks/${selectedTask.id}`);
      dispatch(deleteTask(selectedTask.id)); 
      setSelectedTask(null);
      toast.success("Task deleted successfully!");
    } catch (error) {
      toast.error("Failed to delete task");
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Task List</h1>
      {tasks.length === 0 ? (
        <p>No tasks found</p>
      ) : (
        <ul>
          {tasks.map(task => (
            <li key={task.id} className="bg-gray-100 p-3 mb-2 rounded-md flex justify-between items-center">
              <span><strong>{task.name}</strong> - {task.status}</span>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="bg-red-500 text-white px-2 py-1 rounded" onClick={() => setSelectedTask(task)}>
                    Delete
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <p>Are you sure you want to delete this task?</p>
                  <DialogTitle>Confirm Deletion</DialogTitle>
                  <div className="flex justify-end gap-2 mt-4">
                    <Button onClick={() => setSelectedTask(null)}>Cancel</Button>
                    <Button className="bg-red-500" onClick={handleDelete}>Yes, Delete</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default TaskList;
