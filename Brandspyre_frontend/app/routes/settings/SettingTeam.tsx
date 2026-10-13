
import  { useEffect, useState } from 'react';
import DataTable from 'src/component/DataTable';
import CustomPagination from 'src/component/CustomPagination';
import SearchInput from 'src/component/SearchInput';
import Dropdown from 'src/component/DrapDown';

const SettingTeam = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [sheetData,setSheetData]=useState([])
    const [selectStatus, setSelectStatus] = useState("");
    const [selectedFilter, setSelectedFilter] = useState("");
const data=[
  {id:"1",
    Tname:"AJB Project",
    Tdescription:"Sales Team",
    members:"Karthick, santhiya",
    createdAt:"21-03-2024"
  },
  {id:"2",
    Tname:"Summar campaign",
    Tdescription:"Sales Team",
    members:"Karthick, santhiya",
    createdAt:"21-03-2024"
  },
    {id:"3",
    Tname:"adhi Project",
    Tdescription:"Sales Team",
    members:"Karthick, santhiya",
    createdAt:"21-03-2024"
  },
]
const getData=()=>{
  return data
}
useEffect(()=>{
  setSheetData(getData())
},[])
  // const { loading, error, data } = useQuery(GET_ALL_USERS, {
  //   variables: {
  //     page: currentPage,
  //     limit: pageSize,
  //     search: searchTerm,
  //   },
  // });

  // const handleSearch = (value) => {
  //   setSearchTerm(value);
  //   setCurrentPage(1); // Reset to first page on new search
  // };

  const thead = () => [
    { data: "id" },
    { data: "Team Name" },
    { data: "Description" },
    { data: "Members" },
       { data: "Created At" },
  
  ];

  const tbody = () => {

    if (!data) return [];
    return data.map((user) => ({
      id: user.id,
      data: [
        { data: user.id },
        { data: user.Tname },
        { data: user.Tdescription },
        { data: user.members },
     { data: user.createdAt },
    
      ],
    }));
  };
  const filterOptions = [
    { value: "client", label: "Client" },
    { value: "Project", label: "Project" },
    { value: "Leads", label: "Leads" },
    { value: "Employee", label: "Employee" },
  ];
  const statusOptions = [
    { value: "Pending", label: "Pending" },
    { value: "Paid", label: "Paid" },
    { value: "Un Paid", label: "Un-Paid" },
  ];
  return (
    <div className="flex flex-col min-h-screen">
      <div className="p-4 flex-grow">
      <h2 className="text-xl font-semibold mb-4 text-red-700 dark:text-red-700">
Team List </h2>

      {/* <CommonTable
        thead={thead}
        tbody={tbody}
        isSearch
        className="mb-4"
        actionIcons={['Eye', 'Edit', 'Trash2']}

      /> */}
    
       <div className="flex justify-between">
            <Dropdown
              options={filterOptions}
              selectedValue={selectedFilter}
              onSelect={setSelectedFilter}
              placeholder="Filter By"
              className="w-[200px]"
            />
            <Dropdown
              options={statusOptions}
              selectedValue={selectStatus}
              onSelect={setSelectStatus}
              placeholder="Payment Status"
              className="w-[200px]"
            />
            <Dropdown
              options={filterOptions}
              selectedValue={selectedFilter}
              onSelect={setSelectedFilter}
              placeholder="Sort by"
              className="w-[200px]"
            />
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search users..."
            />
          </div>
      <DataTable
      thead={thead}
      tbody={tbody}
      isSearch
      actionIcons={['Eye', 'Edit', 'Trash2']}
      />
      </div>
        <div className="sticky bottom-0 border-t border-gray-200 dark:border-gray-700 p-4">
      <CustomPagination
  total={100} 
  currentPage={currentPage} 
  defaultPageSize={10} 
  onChange={setCurrentPage} 
  paginationLabel="employees" 
  isScroll={true} 
/>
</div>
</div>
 
  );
};

export default SettingTeam;