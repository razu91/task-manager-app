<?php

namespace App\Http\Controllers;

use App\Events\TaskCreated;
use App\Models\Task;
use Illuminate\Http\Request;

class TaskController extends Controller
{
    // Get all tasks with pagination grouped by status
    public function index(Request $request)
    {
        $perPage = $request->query('perPage', 10); // Default to 5 items per page

        // Paginate tasks by status
        $toDoTasks = Task::where('status', 'To Do')->paginate($perPage, ['*'], 'to_do_page');
        $inProgressTasks = Task::where('status', 'In Progress')->paginate($perPage, ['*'], 'in_progress_page');
        $doneTasks = Task::where('status', 'Done')->paginate($perPage, ['*'], 'done_page');

        return response()->json([
            'to_do' => [
                'data' => $toDoTasks->items(),
                'pagination' => [
                    'current_page' => $toDoTasks->currentPage(),
                    'last_page' => $toDoTasks->lastPage(),
                    'per_page' => $toDoTasks->perPage(),
                    'total' => $toDoTasks->total(),
                ],
            ],
            'in_progress' => [
                'data' => $inProgressTasks->items(),
                'pagination' => [
                    'current_page' => $inProgressTasks->currentPage(),
                    'last_page' => $inProgressTasks->lastPage(),
                    'per_page' => $inProgressTasks->perPage(),
                    'total' => $inProgressTasks->total(),
                ],
            ],
            'done' => [
                'data' => $doneTasks->items(),
                'pagination' => [
                    'current_page' => $doneTasks->currentPage(),
                    'last_page' => $doneTasks->lastPage(),
                    'per_page' => $doneTasks->perPage(),
                    'total' => $doneTasks->total(),
                ],
            ],
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:100',
            'description' => 'nullable|string|max:255',
            'status' => 'required|in:To Do,In Progress,Done',
            'due_date' => 'nullable|date',
        ]);

        $task = Task::create([
            'name' => $request->name,
            'description' => $request->description,
            'status' => $request->status,
            'due_date' => $request->due_date,
        ]);

        broadcast(new TaskCreated($task))->toOthers();

        return response()->json(['task' => $task], 201);
    }

    // Update a task
    public function update(Request $request, $id)
    {
        $task = Task::findOrFail($id);

        $request->validate([
            'name' => 'required|string|max:100',
            'description' => 'nullable|string|max:255',
            'status' => 'required|in:To Do,In Progress,Done',
            'due_date' => 'nullable|date',
        ]);

        $task->update($request->all());

        return response()->json(['task' => $task]);
    }

    // Delete a task
    public function destroy($id)
    {
        $task = Task::findOrFail($id);
        $task->delete();

        return response()->json(['message' => 'Task deleted successfully']);
    }
}
