import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';

import { ChevronDown,ChevronRight,ChevronsRight, Computer, DollarSign, SquareCheckBig, TicketCheck, Link2, FileText, ShieldCheck} from 'lucide-react';

const SettingsSidebar = () => {
 const location = useLocation();
  
  const isSettingsRoute = location.pathname.startsWith('/settings');
  const [openDropdowns, setOpenDropdowns] = useState({
    accessPermission: isSettingsRoute,
    invoice: location.pathname.startsWith('/settings/invoice')
  });
  const toggleDropdown = (dropdown) => {
    setOpenDropdowns(prev => ({
      ...prev,
      [dropdown]: !prev[dropdown]
    }));
  };

  return (
    <div className="w-64 min-w-55 h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 ">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Settings</h2>
      </div>
      
      <nav className="p-2">
        <div className="mb-1">
          <button
            onClick={() => toggleDropdown('accessPermission')}
            className={`w-full flex items-center justify-between p-2 rounded-md ${openDropdowns.accessPermission ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}
          >
            <span className="font-sm text-gray-700 dark:text-gray-300"><SquareCheckBig size={20} className="inline mr-2" />Access Permission</span>
            {openDropdowns.accessPermission ? (
              <ChevronDown size={18} className="text-gray-500 dark:text-gray-400" />
            ) : (
              <ChevronRight size={18} className="text-gray-500 dark:text-gray-400" />
            )}
          </button>
          
          {openDropdowns.accessPermission && (
            <div className="ml-4 mt-1 space-y-1">
              <NavLink
                to="/settings/access-permission/roles"
                className={({ isActive }) => `block px-3 py-2 text-sm rounded-sm ${isActive ? 'bg-gray-200 text-red-700 dark:bg-gray-500/30 dark:text-red-500' : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700'}`}
              >
                Roles
              </NavLink>
              <NavLink
                to="/settings/access-permission/user"
                className={({ isActive }) => `block px-3 py-2 text-sm rounded-sm ${isActive ? 'bg-gray-200 text-red-700  dark:bg-gray-500/30 dark:text-red-500' : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700'}`}
              >
                User Roles
              </NavLink>
              
              <NavLink
                to="/team"
                className={({ isActive }) => `block px-3 py-2 text-sm rounded-sm ${isActive ? 'bg-gray-200 text-red-700  dark:bg-gray-500/30 dark:text-red-500' : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700'}`}
              >
                Teams
              </NavLink>
                            <NavLink
                to="/settings/access-permission/departments"
                className={({ isActive }) => `block px-3 py-2 text-sm rounded-sm ${isActive ? 'bg-gray-200 text-red-700  dark:bg-gray-500/30 dark:text-red-500' : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700'}`}
              >
                Departments
              </NavLink>

                                          <NavLink
                to="/settings/access-permission/designations"
                className={({ isActive }) => `block px-3 py-2 text-sm rounded-sm ${isActive ? 'bg-gray-200 text-red-700  dark:bg-gray-500/30 dark:text-red-500' : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700'}`}
              >
                Designations
              </NavLink>
            </div>
          )}
        </div>

        {/* Invoice Dropdown */}
        {/*<div className="mb-1">
          <button
            onClick={() => toggleDropdown('invoice')}
            className={`w-full flex items-center justify-between p-2 rounded-md ${openDropdowns.invoice ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}
          >
            <span className="font-sm text-gray-700 dark:text-gray-300"><DollarSign size={20} className="inline mr-2" />Invoice</span>
            {openDropdowns.invoice ? (
              <ChevronDown size={18} className="text-gray-500 dark:text-gray-400" />
            ) : (
              <ChevronRight size={18} className="text-gray-500 dark:text-gray-400" />
            )}
          </button>
          
          {openDropdowns.invoice && (
            <div className="ml-4 mt-1 space-y-1">
              <NavLink
                to="/settings/invoice/tax"
                className={({ isActive }) => `block px-3 py-2 text-sm rounded-sm ${isActive ? 'bg-gray-200 text-red-700  dark:bg-gray-500/30 dark:text-red-500' : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700'}`}
              >
                Tax
              </NavLink>
              <NavLink
                to="/settings/invoice/payment-methods"
                className={({ isActive }) => `block px-3 py-2 text-sm rounded-sm ${isActive ? 'bg-gray-200 text-red-700  dark:bg-gray-500/30 dark:text-red-500 ' : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700'}`}
              >
                Payment Methods
              </NavLink>
            </div>
          )}
        </div>*/}
        <div className="mb-1">
          <button
            onClick={() => toggleDropdown('system')}
            className={`w-full flex items-center justify-between p-2 rounded-md ${openDropdowns.system ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}
          >
            <span className="font-sm text-gray-700 dark:text-gray-300"><Computer size={20} className="inline mr-2" />System Setting</span>
            {openDropdowns.system ? (
              <ChevronDown size={18} className="text-gray-500 dark:text-gray-400" />
            ) : (
              <ChevronRight size={18} className="text-gray-500 dark:text-gray-400" />
            )}
          </button>
          
          {openDropdowns.system && (
            <div className="ml-4 mt-1 space-y-1">
              <NavLink
                to="/settings/access-permission/systemsetting"
                className={({ isActive }) => `block px-3 py-2 text-sm rounded-sm ${isActive ? 'bg-gray-200 text-red-700  dark:bg-gray-500/30 dark:text-red-500' : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700'}`}
              >
                System Settings
              </NavLink>
              <NavLink
                to="/settings/joining-letter-template"
                className={({ isActive }) => `block px-3 py-2 text-sm rounded-sm ${isActive ? 'bg-gray-200 text-red-700  dark:bg-gray-500/30 dark:text-red-500' : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700'}`}
              >
                Joining Letter Template
              </NavLink>
              <NavLink
                to="/settings/document-templates"
                className={({ isActive }) => `block px-3 py-2 text-sm rounded-sm ${isActive ? 'bg-gray-200 text-red-700  dark:bg-gray-500/30 dark:text-red-500' : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700'}`}
              >
                Document Templates
              </NavLink>
         
            </div>
          )}
        </div>

        {/* Organization Modules & Features */}
        <div className="mb-1">
          <NavLink
            to="/settings/modules"
            className={({ isActive }) => `w-full flex items-center justify-between p-2 rounded-md ${isActive ? 'bg-gray-100 dark:bg-gray-700 text-red-700 dark:text-red-500 font-semibold' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}
          >
            <span className="font-sm text-gray-700 dark:text-gray-300"><FileText size={20} className="inline mr-2 text-red-600" />Modules & Features</span>
          </NavLink>
        </div>

        {/* Subscription & Billing */}
        <div className="mb-1">
          <NavLink
            to="/settings/billing"
            className={({ isActive }) => `w-full flex items-center justify-between p-2 rounded-md ${isActive ? 'bg-gray-100 dark:bg-gray-700 text-red-700 dark:text-red-500 font-semibold' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}
          >
            <span className="font-sm text-gray-700 dark:text-gray-300"><DollarSign size={20} className="inline mr-2 text-red-600" />Subscription & Billing</span>
          </NavLink>
        </div>

        {/* Security & Multi-Factor Authentication */}
        <div className="mb-1">
          <NavLink
            to="/settings/security"
            className={({ isActive }) => `w-full flex items-center justify-between p-2 rounded-md ${isActive ? 'bg-gray-100 dark:bg-gray-700 text-red-700 dark:text-red-500 font-semibold' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}
          >
            <span className="font-sm text-gray-700 dark:text-gray-300"><ShieldCheck size={20} className="inline mr-2 text-red-600" />Security & MFA</span>
          </NavLink>
        </div>

        {/* Integrations */}
        <div className="mb-1">
          <NavLink
            to="/settings/integrations/meta"
            className={({ isActive }) => `w-full flex items-center justify-between p-2 rounded-md ${isActive ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}
          >
            <span className="font-sm text-gray-700 dark:text-gray-300"><Link2 size={20} className="inline mr-2" />Meta Integration</span>
          </NavLink>
        </div>
      </nav>
    </div>
  );
};

export default SettingsSidebar;