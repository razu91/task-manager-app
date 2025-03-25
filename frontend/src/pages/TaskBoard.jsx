import { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setTasks, updateTask, addTask } from "../redux/taskSlice";
import axios from "axios";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger, DialogContent, DialogTitle } from "@/components/ui/dialog";
import toast from "react-hot-toast";

function TaskBoard() {
  const dispatch = useDispatch();
  const tasks = useSelector((state) => state.tasks.list);
  
  const [open, setOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [task, setTask] = useState({ 
    name: "", 
    description: "", 
    status: "To Do", 
    due_date: "" 
  });
  const [isLoading, setIsLoading] = useState(false);

  // Comprehensive fetch tasks method
  const fetchTasks = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await axios.get("http://127.0.0.1:8000/api/tasks");
      
      // Ensure we're dispatching the entire response data
      dispatch(setTasks(response.data));
    } catch (error) {
      console.error("Error fetching tasks:", error);
      toast.error("Failed to fetch tasks");
    } finally {
      setIsLoading(false);
    }
  }, [dispatch]);

  // Fetch tasks on component mount
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Drag and drop handler with comprehensive error handling
  const onDragEnd = async (result) => {
    const { source, destination } = result;
    
    if (!destination) return;

    const draggedTask = tasks.find(task => 
      task.id === parseInt(result.draggableId)
    );

    if (!draggedTask) return;

    const updatedTask = {
      ...draggedTask,
      status: destination.droppableId
    };

    try {
      const response = await axios.put(
        `http://127.0.0.1:8000/api/tasks/${draggedTask.id}`, 
        updatedTask
      );
      
      // Refetch tasks to ensure complete update
      await fetchTasks();
      
      toast.success("Task updated!");
    } catch (error) {
      console.error("Error updating task:", error);
      toast.error("Failed to update task");
    }
  };

  // Form submission handler with comprehensive logic
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (selectedTask) {
        // Update existing task
        const response = await axios.put(
          `http://127.0.0.1:8000/api/tasks/${task.id}`, 
          task
        );
        
        // Refetch tasks to ensure complete update
        await fetchTasks();
        toast.success("Task updated!");
      } else {
        // Add new task
        const response = await axios.post(
          "http://127.0.0.1:8000/api/tasks", 
          task
        );
        
        // Refetch tasks to ensure complete update
        await fetchTasks();
        toast.success("Task added!");
      }
    } catch (error) {
      console.error("Error saving task:", error);
      toast.error("Failed to save task");
    } finally {
      setOpen(false);
      setSelectedTask(null);
      setTask({ 
        name: "", 
        description: "", 
        status: "To Do", 
        due_date: "" 
      });
      setIsLoading(false);
    }
  };

  // Debug logging
  useEffect(() => {
    console.log("Current tasks:", tasks);
  }, [tasks]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Task Board (Trello Clone)</h1>
      <Button 
        onClick={() => {
          setSelectedTask(null);
          setTask({ name: "", description: "", status: "To Do", due_date: "" });
          setOpen(true);
        }} 
        disabled={isLoading}
      >
        {isLoading ? "Processing..." : "+ Add Task"}
      </Button>
      
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-3 gap-4 mt-6">
          {["To Do", "In Progress", "Done"].map((status) => (
            <Droppable key={status} droppableId={status}>
              {(provided) => (
                <div 
                  ref={provided.innerRef} 
                  {...provided.droppableProps} 
                  className="bg-gray-100 p-4 rounded-md min-h-[300px]"
                >
                  <h2 className="text-lg font-semibold mb-3">{status}</h2>
                  {tasks
                    .filter(task => task.status === status)
                    .map((task, index) => (
                      <Draggable 
                        key={task.id} 
                        draggableId={String(task.id)} 
                        index={index}
                      >
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className="bg-white p-3 rounded-md shadow-md mb-2 cursor-pointer"
                            onClick={() => { 
                              setTask({...task}); 
                              setSelectedTask({...task}); 
                              setOpen(true); 
                            }}
                          >
                            <strong>{task.name}</strong>
                            <p className="text-sm text-gray-600">{task.description}</p>
                            <span className="text-xs text-gray-500">{task.due_date}</span>
                          </div>
                        )}
                      </Draggable>
                    ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild></DialogTrigger>
        <DialogContent>
          <DialogTitle className="text-lg font-bold">
            {selectedTask ? "Edit Task" : "Add Task"}
          </DialogTitle>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Task Name"
              className="border p-2 w-full"
              value={task.name}
              onChange={(e) => setTask({ ...task, name: e.target.value })}
              required
            />
            <textarea
              placeholder="Description"
              className="border p-2 w-full"
              value={task.description}
              onChange={(e) => setTask({ ...task, description: e.target.value })}
              required
            />
            <select
              className="border p-2 w-full"
              value={task.status}
              onChange={(e) => setTask({ ...task, status: e.target.value })}
            >
              <option>To Do</option>
              <option>In Progress</option>
              <option>Done</option>
            </select>
            <input
              type="date"
              className="border p-2 w-full"
              value={task.due_date}
              onChange={(e) => setTask({ ...task, due_date: e.target.value })}
              required
            />
            <div className="flex justify-end gap-2">
              <Button 
                type="button" 
                onClick={() => setOpen(false)} 
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading}
              >
                {isLoading 
                  ? "Saving..." 
                  : (selectedTask ? "Update" : "Add") + " Task"
                }
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default TaskBoard;