import { ChangeEvent, useEffect, useState } from "react";
import { supabase } from "../supabase-client";
import { Session } from "@supabase/supabase-js";

interface Task {
  id: string;
  created_at: string;
  user_id: string;
  assigned_to: string | null;
  title: string;
  description: string | null;
  status: string;
  due_date: string | null;
  is_completed: boolean;
  image_url: string | null;
}

function TaskManager({ session }: { session: Session }) {
  const [newTask, setNewTask] = useState({ title: "", description: "" });
  const [tasks, setTasks] = useState<Task[]>([]);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editedTask, setEditedTask] = useState<Partial<Task>>({});

  const [taskImage, setTaskImage] = useState<File | null>(null);

  const fetchTasks = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.error("User not logged in.");
      return;
    }

    const { error, data } = await supabase
      .from("tasks")
      .select("*")
      .or(`user_id.eq.${user.id},assigned_to.eq.${user.id}`)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error reading task: ", error.message);
      return;
    }

    setTasks(data);
  };

  const deleteTask = async (id: string) => {
    const { error } = await supabase.from("tasks").delete().eq("id", id);

    if (error) {
      console.error("Error deleting task: ", error.message);
      return;
    }
  };

  const updateTask = async (id: string, updatedFields: Partial<Task>) => {
    const { error } = await supabase
      .from("tasks")
      .update(updatedFields)
      .eq("id", id);

    if (error) {
      console.error("Error updating task: ", error.message);
      return;
    }
    fetchTasks();
    setEditingTaskId(null);
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    const filePath = `${file.name}-${Date.now()}`;

    const { error } = await supabase.storage
      .from("tasks-images")
      .upload(filePath, file);

    if (error) {
      console.error("Error uploading image:", error.message);
      return null;
    }

    const { data } = await supabase.storage
      .from("tasks-images")
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    let imageUrl: string | null = null;
    if (taskImage) {
      imageUrl = await uploadImage(taskImage);
    }

    const { error } = await supabase
      .from("tasks")
      .insert({
        ...newTask,
        user_id: session.user.id,
        image_url: imageUrl,
        status: "todo", // Default status
        is_completed: false, // Default completion status
      })
      .select()
      .single();

    if (error) {
      console.error("Error adding task: ", error.message);
      return;
    }

    setNewTask({ title: "", description: "" });
    fetchTasks();
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setTaskImage(e.target.files[0]);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  useEffect(() => {
    const channel = supabase.channel("tasks-channel");
    channel
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "tasks" },
        (payload) => {
          const newTaskPayload = payload.new as Task;
          setTasks((prev) => {
            // Check if the task already exists to avoid duplicates
            if (!prev.some((task) => task.id === newTaskPayload.id)) {
              return [...prev, newTaskPayload];
            }
            return prev;
          });
        }
      )
      .subscribe((status) => {
        console.log("Subscription: ", status);
      });
  }, []);

  console.log(tasks);

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>Task Manager</h2>

      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          type="text"
          placeholder="Task Title"
          value={newTask.title}
          onChange={(e) =>
            setNewTask((prev) => ({ ...prev, title: e.target.value }))
          }
          style={styles.input}
        />
        <textarea
          placeholder="Task Description"
          value={newTask.description}
          onChange={(e) =>
            setNewTask((prev) => ({ ...prev, description: e.target.value }))
          }
          style={styles.textarea}
        />
        <input type="file" accept="image/*" onChange={handleFileChange} style={styles.fileInput} />
        <button type="submit" style={styles.button}>
          Add Task
        </button>
      </form>

      <ul style={styles.taskList}>
        {tasks.map((task) => (
          <li key={task.id} style={styles.taskItem}>
            {editingTaskId === task.id ? (
              <div style={{ width: "100%" }}>
                <input
                  type="text"
                  defaultValue={task.title}
                  onChange={(e) =>
                    setEditedTask({ ...editedTask, title: e.target.value })
                  }
                  style={styles.input}
                />
                <textarea
                  defaultValue={task.description || ""}
                  onChange={(e) =>
                    setEditedTask({
                      ...editedTask,
                      description: e.target.value,
                    })
                  }
                  style={styles.textarea}
                />
                <select
                  defaultValue={task.status}
                  onChange={(e) =>
                    setEditedTask({ ...editedTask, status: e.target.value })
                  }
                  style={styles.input}
                >
                  <option value="todo">Todo</option>
                  <option value="in_progress">In Progress</option>
                  <option value="done">Done</option>
                </select>
                <input
                  type="date"
                  defaultValue={
                    task.due_date ? task.due_date.split("T")[0] : ""
                  }
                  onChange={(e) =>
                    setEditedTask({ ...editedTask, due_date: e.target.value })
                  }
                  style={styles.input}
                />
                <label>
                  <input
                    type="checkbox"
                    defaultChecked={task.is_completed}
                    onChange={(e) =>
                      setEditedTask({
                        ...editedTask,
                        is_completed: e.target.checked,
                      })
                    }
                  />
                  Completed
                </label>
                <div style={styles.editActions}>
                  <button
                    style={styles.saveButton}
                    onClick={() => updateTask(task.id, editedTask)}
                  >
                    Save
                  </button>
                  <button
                    style={styles.cancelButton}
                    onClick={() => setEditingTaskId(null)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div style={styles.taskContent}>
                  <h3>{task.title}</h3>
                  <p>{task.description}</p>
                  {task.image_url && (
                    <img
                      src={task.image_url}
                      style={styles.taskImage}
                      alt={task.title}
                    />
                  )}
                  <div style={styles.taskDetails}>
                    <span style={styles.detailLabel}>Status:</span>{" "}
                    {task.status}
                  </div>
                  <div style={styles.taskDetails}>
                    <span style={styles.detailLabel}>Due Date:</span>{" "}
                    {task.due_date
                      ? new Date(task.due_date).toLocaleDateString()
                      : "N/A"}
                  </div>
                  <div style={styles.taskDetails}>
                    <span style={styles.detailLabel}>Completed:</span>{" "}
                    {task.is_completed ? "Yes" : "No"}
                  </div>
                </div>
                <div style={styles.taskActions}>
                  <button
                    style={styles.updateButton}
                    onClick={() => {
                      setEditingTaskId(task.id);
                      setEditedTask(task);
                    }}
                  >
                    Edit
                  </button>
                  <button
                    style={styles.deleteButton}
                    onClick={() => deleteTask(task.id)}
                  >
                    Delete
                  </button>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

const styles = {
  container: {
    width: '100%',
    padding: '2rem',
    fontFamily: 'Arial, sans-serif',
  },
  header: {
    textAlign: 'center' as const,
    marginBottom: '2rem',
    color: '#fff',
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    marginBottom: '2rem',
  },
  input: {
    marginBottom: '1rem',
    padding: '0.75rem',
    fontSize: '1rem',
    border: '1px solid #444',
    borderRadius: '4px',
    backgroundColor: '#2c2c2c',
    color: '#fff',
  },
  textarea: {
    marginBottom: '1rem',
    padding: '0.75rem',
    fontSize: '1rem',
    border: '1px solid #444',
    borderRadius: '4px',
    minHeight: '100px',
    backgroundColor: '#2c2c2c',
    color: '#fff',
  },
  fileInput: {
    marginBottom: '1rem',
  },
  button: {
    padding: '0.75rem 1.5rem',
    fontSize: '1rem',
    backgroundColor: '#007bff',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  taskList: {
    listStyle: 'none',
    padding: 0,
  },
  taskItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    border: '1px solid #3c3c3c',
    borderRadius: '8px',
    padding: '1.5rem',
    marginBottom: '1rem',
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
    backgroundColor: '#2c2c2c',
  },
  taskContent: {
    flex: 1,
  },
  taskImage: {
    height: '100px',
    borderRadius: '4px',
    marginTop: '1rem',
  },
  taskDetails: {
    marginTop: '0.5rem',
  },
  detailLabel: {
    fontWeight: 'bold' as const,
  },
  taskActions: {
    display: 'flex',
    flexDirection: 'column' as const,
  },
  editActions: {
    display: 'flex',
    marginTop: '1rem',
  },
  saveButton: {
    padding: '0.5rem 1rem',
    fontSize: '0.9rem',
    backgroundColor: '#007bff',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    marginRight: '0.5rem',
  },
  cancelButton: {
    padding: '0.5rem 1rem',
    fontSize: '0.9rem',
    backgroundColor: '#6c757d',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  updateButton: {
    padding: '0.5rem 1rem',
    fontSize: '0.9rem',
    backgroundColor: '#28a745',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    marginBottom: '0.5rem',
  },
  deleteButton: {
    padding: '0.5rem 1rem',
    fontSize: '0.9rem',
    backgroundColor: '#dc3545',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
};

export default TaskManager;
