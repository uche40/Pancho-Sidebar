import React from 'react';
import { LucideProps } from 'lucide-react';
import {
    Home, Globe, LayoutGrid, Tag, User, Wallet, Headset, Shield, Info,
    LayoutDashboard, Sliders, CreditCard, Receipt, History, Coins,
    PlusCircle, Ticket, Video, Book, Download, FileText, Eye,
    ShieldCheck, Megaphone, Signal, UserCircle
} from 'lucide-react';

type LucideIcon = React.ForwardRefExoticComponent<Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>>;

export const iconMap: { [key: string]: LucideIcon } = {
    Home, Globe, LayoutGrid, Tag, User, Wallet, Headset, Shield, Info,
    LayoutDashboard, Sliders, CreditCard, Receipt, History, Coins,
    PlusCircle, Ticket, Video, Book, Download, FileText, Eye,
    ShieldCheck, Megaphone, Signal, UserCircle
};
