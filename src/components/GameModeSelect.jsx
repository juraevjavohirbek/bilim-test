import { useId } from "react";
import { gameModes } from "../lib/gameModes";

export default function GameModeSelect({ mode, onChange }) {
  const id = useId();
  return (
    <div className="game-mode-select">
      <label htmlFor={id}>O‘yin usuli</label>
      <select id={id} value={mode} onChange={(event) => onChange(event.target.value)}>
        {gameModes.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}
      </select>
    </div>
  );
}
