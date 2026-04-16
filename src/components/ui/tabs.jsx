import React, { createContext, useContext, useState } from 'react';

// 1. Criamos o contexto com um objeto vazio por defeito para evitar o erro de "Type null"
const TabsContext = createContext(/** @type {any} */ ({}));

/**
 * @param {{ defaultValue: string, children: React.ReactNode, className?: string }} props
 */
export const Tabs = ({ defaultValue, children, className = "" }) => {
  const [activeTab, setActiveTab] = useState(defaultValue);

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={className}>
        {children}
      </div>
    </TabsContext.Provider>
  );
};

/**
 * @param {{ children: React.ReactNode, className?: string }} props
 */
export const TabsList = ({ children, className = "" }) => {
  return (
    <div className={`flex items-center ${className}`}>
      {children}
    </div>
  );
};

/**
 * @param {{ value: string, children: React.ReactNode, className?: string }} props
 */
export const TabsTrigger = ({ value, children, className = "" }) => {
  const context = useContext(TabsContext);
  
  // Garantir que o TypeScript entende que o contexto existe
  if (!context || !('activeTab' in context)) {
    return null;
  }

  const { activeTab, setActiveTab } = context;
  const isActive = activeTab === value;

  const baseStyles = "inline-flex items-center justify-center whitespace-nowrap transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50";
  const activeStyles = isActive 
    ? "bg-white text-foreground shadow-sm" 
    : "text-muted-foreground hover:text-foreground";

  return (
    <button
      type="button"
      onClick={() => setActiveTab(value)}
      className={`${baseStyles} ${activeStyles} ${className}`}
    >
      {children}
    </button>
  );
};

/**
 * @param {{ value: string, children: React.ReactNode, className?: string }} props
 */
export const TabsContent = ({ value, children, className = "" }) => {
  const context = useContext(TabsContext);

  if (!context || !('activeTab' in context)) {
    return null;
  }

  const { activeTab } = context;

  if (activeTab !== value) return null;

  return (
    <div className={`mt-2 ring-offset-background focus-visible:outline-none ${className}`}>
      {children}
    </div>
  );
};