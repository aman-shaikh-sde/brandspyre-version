# Componant's

## Button

```tsx
import { Button } from "@react-router/components";
```

- Normal Button

```tsx
index.tsx;
const [loading, setLoading] = React.useState(false);

<Button
  title="Click Me"
  icon="arrow-right"
  type="primary"
  onClick={() => console.log("clicked")}
  loading={loading}
/>;
```

```tsx
import React from "react";

interface ButtonProps {
  title: "Primary" | "Secondary";
  icon?: string;
  type?: "primary" | "secondary";
  loading?: boolean;
  onClick?: () => void;
}

const Button: React.FC<ButtonProps> = {};

export default Button;
```
     <div  className="flex flex-col py-2 text-left mt-1">
        <label htmlFor="" className="text-xs text-gray-700 mb-3">Password</label>
        <input className="block bg-gray-200 text-sm px-2 py-2 border border-gray-400 focus:outline-none focus:bg-gray-100 focus:border-gray-400 rounded" type="text"/>
      </div>

            {/* <div  className="flex flex-col py-2 text-left mt-2">
        <label htmlFor="" className="text-medium text-gray-700 mb-3 font-light dark:text-gray-300">UserName</label>
        <input className="block bg-gray-200 text-sm px-2 py-2 border border-gray-400 focus:outline-none focus:bg-gray-100 focus:border-gray-400 rounded" type="text"/>
        </div> */}


       --- drop down form submission componet fled---
           <Dropdown
        options={categoryOptions}
        selectedValue={formData.category}
        onSelect={(value) => setFormData({ ...formData, category: value as string })}
        placeholder="Select a category"
        name="category"
        label="Product Category"
        required
      />
      --drop down normal field----
      
      <Dropdown
        options={filterOptions}
        selectedValue={selectedFilter}
        onSelect={setSelectedFilter}
        placeholder="Sort by"
        className="w-[200px]"
      />
      ---common table component----
               {/* <CommonTable
        thead={thead}
        tbody={tbody}
        isSearch
        className="mb-4"
        actionIcons={['Eye', 'Edit', 'Trash2']}

      /> */}

  