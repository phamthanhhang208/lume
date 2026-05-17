interface IngredientListProps {
  ingredients: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
}

export default function IngredientList({
  ingredients,
  onChange,
  disabled = false,
}: IngredientListProps) {
  const editAt = (index: number, value: string) => {
    const next = ingredients.slice();
    next[index] = value;
    onChange(next);
  };
  const removeAt = (index: number) => {
    onChange(ingredients.filter((_, i) => i !== index));
  };
  const add = () => onChange([...ingredients, ""]);

  return (
    <fieldset disabled={disabled}>
      <legend>ingredients ({ingredients.length})</legend>
      {ingredients.length === 0 && <p>no ingredients detected. add some below.</p>}
      <ol>
        {ingredients.map((ingredient, index) => (
          <li key={index}>
            <input
              type="text"
              value={ingredient}
              onChange={(event) => editAt(index, event.target.value)}
            />{" "}
            <button type="button" onClick={() => removeAt(index)}>
              remove
            </button>
          </li>
        ))}
      </ol>
      <button type="button" onClick={add}>
        add ingredient
      </button>
    </fieldset>
  );
}
