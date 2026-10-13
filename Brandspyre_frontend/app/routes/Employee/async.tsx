import AsyncSelect from "react-select/async";



 {isFetchingClients ? (
        <div className="text-sm text-gray-500 mt-1">Loading clients...</div>
      ) : (
        <AsyncSelect
          cacheOptions
          name="client_code"
          defaultOptions={clientOptions}
          loadOptions={loadOptions}
          onChange={(selected: Option | null) =>
            setFormData({ ...formData, client_code: selected ? selected.value : "" })
          }
          value={clientOptions.find((opt) => opt.value === formData.client_code) || null}
          isDisabled={!formData.branchcode || clientOptions.length === 0}
          placeholder="Select or search client"
        />
      )}


        {isFetchingStaff ? (
        <div className="text-sm text-gray-500 mt-1">Loading clients...</div>
      ) : (
        <AsyncSelect
          cacheOptions
          defaultOptions={staffOptions}
          name="handler_by"
          loadOptions={loadStaffs}
          onChange={(selected: Option | null) =>
            setFormData({ ...formData, handler_by: selected ? selected.value : "" })
          }
          value={staffOptions.find((opt) => opt.value === formData.handler_by) || null}
          isDisabled={!formData.department || staffOptions.length === 0}
          placeholder="Select or search client"
        />
      )}




const loadOptions = (inputValue: string, callback: (options: Option[]) => void) => {
    const filtered = clientOptions.filter((c) =>
      c.label.toLowerCase().includes(inputValue.toLowerCase())
    );
    callback(filtered);
  };

   const loadStaffs = (inputValue: string, callback: (options: Option[]) => void) => {
    const filtered = staffOptions.filter((c) =>
      c.label.toLowerCase().includes(inputValue.toLowerCase())
    );
    callback(filtered);
  };