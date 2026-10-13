import { useStore } from "src/stores/useBranchStore";
import { useMemo } from "react";
const Cam = () => {
  
const todos=useStore(state=>state.todos)
const completed=useMemo(()=>todos.filter(todo=>todo.completed),[todos])
  return (
    <div>
      <h1>Complted todo</h1>
      <div>
        {completed.map(todo => (
          <div key={todo.id}>
            <p>{todo.title}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
export default Cam;
