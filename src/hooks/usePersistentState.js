import { useEffect, useState } from "react";
import { readStorage, writeStorage } from "../utils/storage";

export default function usePersistentState(key, initialValue) {
  const [value, setValue] = useState(() => readStorage(key, initialValue));

  useEffect(() => {
    writeStorage(key, value);
  }, [key, value]);

  return [value, setValue];
}
