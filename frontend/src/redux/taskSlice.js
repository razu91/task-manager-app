import { createSlice } from "@reduxjs/toolkit";

const taskSlice = createSlice({
  name: "tasks",
  initialState: {
    list: [],
  },
  reducers: {
    setTasks: (state, action) => {
      // Replace tasks
      state.list = action.payload;
    },
    appendTasks: (state, action) => {
      // Append tasks
      state.list = [...state.list, ...action.payload];
    },
    addTask: (state, action) => {      
      // Create a new array with the added task
      state.list = [...state.list, {...action.payload}];
    },
    updateTask: (state, action) => {
      // Create a new array with the updated task
      const index = state.list.findIndex(task => task.id === action.payload.id);
      if (index !== -1) {
        const newList = [...state.list];
        newList[index] = {...action.payload};
        state.list = newList;
      }
    },
    deleteTask: (state, action) => {
      // Create a new array with the task filtered out
      state.list = state.list.filter(task => task.id !== action.payload);
    },
  },
});

export const { setTasks, appendTasks, addTask, updateTask, deleteTask } = taskSlice.actions;
export default taskSlice.reducer;