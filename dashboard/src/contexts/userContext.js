import React, { createContext, useState } from "react";

export const UserContext=createContext();

export const USerProvider=({children})=>{
    const [user,setUser]=useState(null);
    
    return(
        <UserContext.Provider value={{user,setUser}}>
            {children}
        </UserContext.Provider>
    )
}

export const RightContext=createContext();

export const RightProvider=({children})=>{
    const [right,setRight]=useState(false);
    return (
        <RightContext.Provider value={{right,setRight}}>
            {children}
        </RightContext.Provider>
    )
}

