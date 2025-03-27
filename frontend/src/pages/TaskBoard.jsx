import { useEffect, useState, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setTasks, updateTask, addTask } from "../redux/taskSlice";
import axios from "axios";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger, DialogContent, DialogTitle } from "@/components/ui/dialog";
import toast from "react-hot-toast";
import { useNavigate } from "react-router";

function TaskBoard() {
  const navigate = useNavigate(); 
  const { isAuthenticated, token } = useSelector((state) => state.auth);
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

  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");
  const [statusFilter, setStatusFilter] = useState("All");
  const [originalTasks, setOriginalTasks] = useState([]);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");

  const [isLoading, setIsLoading] = useState(false);

  // New state for validation errors
  const [validationErrors, setValidationErrors] = useState({});

  // Date formatting utility functions
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    
    // Parse the full datetime string
    const date = new Date(dateString);
    
    // Convert to YYYY-MM-DD format for input
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  };

  // Validation function
  const validateTask = () => {
    const errors = {};

    // Name validation
    if (!task.name.trim()) {
      errors.name = "Task name is required";
    } else if (task.name.length < 3) {
      errors.name = "Task name must be at least 3 characters long";
    }

    // Description validation
    if (!task.description.trim()) {
      errors.description = "Description is required";
    } else if (task.description.length < 10) {
      errors.description = "Description must be at least 10 characters long";
    }

    // Due date validation
    if (!task.due_date) {
      errors.due_date = "Due date is required";
    } else {
      const selectedDate = new Date(task.due_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        errors.due_date = "Due date cannot be in the past";
      }
    }

    // Status validation
    if (!["To Do", "In Progress", "Done"].includes(task.status)) {
      errors.status = "Invalid status selected";
    }

    return errors;
  };

  const fetchTasks = useCallback(async () => {
    // Authentication check
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    try {
      setIsLoading(true);
      
      // Changed to use debouncedSearchQuery
      const response = await axios.get("http://127.0.0.1:8000/api/tasks", {
        params: {
          search: debouncedSearchQuery, 
          status: statusFilter,
          sort: sortOrder
        }
      });
  
      setOriginalTasks(response.data);
      dispatch(setTasks(response.data));
  
    } catch (error) {
       // 401 error handling
      if (error.response && error.response.status === 401) {
        toast.error("Session expired. Please login again.");
        navigate('/login');
      } else {
        console.error("Error fetching tasks:", error);
        toast.error("Failed to fetch tasks");
      }
    } finally {
      setIsLoading(false);
    }
  }, [dispatch, debouncedSearchQuery, statusFilter, sortOrder]); 

const filteredTasks = useMemo(() => {
  let result = [...originalTasks];

  if (debouncedSearchQuery.trim()) {
    result = result.filter(task => 
      task.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
    );
  }
   
  // Apply status filter
  if (statusFilter !== "All") {
    result = result.filter(task => task.status === statusFilter);
  }
  
  // Sort tasks by due date
  result.sort((a, b) => {
    return sortOrder === "desc"
      ? new Date(b.due_date) - new Date(a.due_date)
      : new Date(a.due_date) - new Date(b.due_date);
  });

  return result;
}, [originalTasks, debouncedSearchQuery, statusFilter, sortOrder]);

//useEffect to update tasks in Redux when filtered tasks change
useEffect(() => {
  dispatch(setTasks(filteredTasks));
}, [filteredTasks, dispatch]);

useEffect(() => {
  const handler = setTimeout(() => {
    setDebouncedSearchQuery(searchQuery);
  }, 500); // 500ms delay

  return () => {
    clearTimeout(handler);
  };
}, [searchQuery]);

// Authentication check in useEffect
useEffect(() => {
  if (!isAuthenticated) {
    navigate('/login');
    return;
  }

  // Configure axios default headers with token
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
}, [isAuthenticated, token, navigate]);

// Fetch tasks on component mount
useEffect(() => {
  fetchTasks();
}, [debouncedSearchQuery, fetchTasks]);

  useEffect(() => {
    console.log("Search query changed:", searchQuery);
    const delaySearch = setTimeout(() => {
        fetchTasks(); // Fetch tasks when search query changes
    }, 500);
    return () => clearTimeout(delaySearch);  
  },[searchQuery,fetchTasks]);
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
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    e.preventDefault();

    // Clear previous validation errors
    setValidationErrors({});
    // Validate the task
    const errors = validateTask();
    // If there are validation errors, set them and prevent submission
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

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
      if (error.response && error.response.status === 401) {
        toast.error("Session expired. Please login again.");
        navigate('/login');
      }
      // Handle backend validation errors
      if (error.response && error.response.data && error.response.data.errors) {
        const backendErrors = error.response.data.errors;
        
        // Map backend errors to our validation state
        const formattedErrors = {};
        Object.keys(backendErrors).forEach(key => {
          // Use the first error message for each field
          formattedErrors[key] = backendErrors[key][0] || "Invalid input";
        });

        console.log(formattedErrors);
        setValidationErrors(formattedErrors);
        // Optionally, show the main error message
        if (error.response.data.message) {
          toast.error(error.response.data.message);
        } else {
          toast.error("Please check the form for errors");
        }
      } else {
        console.error("Error saving task:", error);
        toast.error("Failed to save task");
      }

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
  
  if (!isAuthenticated) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <p className="text-xl mb-4">Please log in to access the Task Board</p>
          <Button onClick={() => navigate('/login')}>Go to Login</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between gap-4 mb-4">
        <div className="right-side">
          <h1 className="text-2xl font-bold mb-4">Task Board</h1>
        </div>
        <div className="sort_search ml-2">
          {/* Search Input */}
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border p-2 w-1/3"
          />

          {/* Status Filter Dropdown */}
          <select 
            className="border p-2 ml-2" 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All</option>
            <option value="To Do">To Do</option>
            <option value="In Progress">In Progress</option>
            <option value="Done">Done</option>
          </select>

        {/* Sort Order Dropdown */}
        <select 
          className="border p-2 ml-2"
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}>
          <option value="asc">Sort by Due Date (ASC)</option>
          <option value="desc">Sort by Due Date (DESC)</option>
        </select>
      </div>
      </div>
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
            <div>
            <input
              type="text"
              placeholder="Task Name"
              className="border p-2 w-full"
              value={task.name}
              onChange={(e) => setTask({ ...task, name: e.target.value })}
              required
            />
              {validationErrors.name && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.name}</p>
              )}
            </div>
            <div>
            <textarea
              placeholder="Description"
              className="border p-2 w-full"
              value={task.description}
              onChange={(e) => setTask({ ...task, description: e.target.value })}
              required
            />
              {validationErrors.description && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.description}</p>
              )}
            </div>
            <div>
            <select
              className="border p-2 w-full"
              value={task.status}
              onChange={(e) => setTask({ ...task, status: e.target.value })}
            >
              <option>To Do</option>
              <option>In Progress</option>
              <option>Done</option>
            </select>
              {validationErrors.status && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.status}</p>
              )}
            </div>
            <div>
            <input
              type="date"
              className="border p-2 w-full"
              value={formatDateForInput(task.due_date)}
              onChange={(e) => setTask({ ...task, due_date: e.target.value })}
              required
            />
              {validationErrors.due_date && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.due_date}</p>
              )}
            </div>
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