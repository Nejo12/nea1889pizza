'use client';
import {createContext,useContext} from 'react';
export type StaffFetch=(url:string,init?:RequestInit)=>Promise<Response>;
export const StaffFetchContext=createContext<StaffFetch>((url,init)=>fetch(url,init));
export function useStaffFetch(){return useContext(StaffFetchContext);}
