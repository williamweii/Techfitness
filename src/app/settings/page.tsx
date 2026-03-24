import React from 'react';
import Link from 'next/link';
import { ArrowLeft, User, Bell, Shield, Smartphone, CreditCard, ChevronRight, HelpCircle, LogOut } from 'lucide-react';

export default function SettingsPage() {
    return (
        <main className="min-h-screen text-white overflow-x-hidden pb-32">
            <div className="w-full max-w-md mx-auto relative min-h-screen">
                {/* Header */}
                <div className="sticky top-0 z-50 bg-black/40 backdrop-blur-xl border-b border-white/5 px-4 py-4 flex items-center gap-4">
                    <Link href="/profile" className="p-2 -ml-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors">
                        <ArrowLeft size={20} className="text-zinc-300" />
                    </Link>
                    <h1 className="text-xl font-bold tracking-wide">設定</h1>
                </div>

                <div className="p-4 space-y-6">
                    
                    {/* Account Section */}
                    <section>
                        <h2 className="text-xs font-semibold text-purple-400 uppercase tracking-widest mb-3 pl-1">帳戶設定</h2>
                        <div className="bg-zinc-900/50 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden">
                            <SettingItem icon={<User size={18} />} label="個人資料" value="Felix Hsu" hasBorder />
                            <SettingItem icon={<CreditCard size={18} />} label="訂閱管理" value="Premium (啟用中)" hasBorder />
                            <SettingItem icon={<Shield size={18} />} label="隱私與安全性" />
                        </div>
                    </section>

                    {/* App Settings */}
                    <section>
                        <h2 className="text-xs font-semibold text-purple-400 uppercase tracking-widest mb-3 pl-1">應用程式</h2>
                        <div className="bg-zinc-900/50 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden">
                            <SettingItem icon={<Bell size={18} />} label="通知設定" hasBorder />
                            <SettingItem icon={<Smartphone size={18} />} label="外觀主題" value="系統預設" hasBorder />
                            <SettingItem icon={<HelpCircle size={18} />} label="幫助與支援" />
                        </div>
                    </section>

                    {/* System */}
                    <section>
                        <div className="bg-zinc-900/50 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden">
                            <button className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors text-red-400">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-red-500/10 rounded-xl">
                                        <LogOut size={18} />
                                    </div>
                                    <span className="font-semibold">登出帳號</span>
                                </div>
                            </button>
                        </div>
                    </section>
                    
                    <div className="flex flex-col items-center justify-center pt-8 pb-4 opacity-50">
                        <p className="text-xs font-semibold tracking-widest uppercase">TechFitness App</p>
                        <p className="text-[10px] mt-1">版本 2.0.1 (Build 2403)</p>
                    </div>
                </div>
            </div>
        </main>
    );
}

function SettingItem({ icon, label, value, hasBorder }: { icon: React.ReactNode, label: string, value?: string, hasBorder?: boolean }) {
    return (
        <button className={`w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors ${hasBorder ? 'border-b border-white/5' : ''}`}>
            <div className="flex items-center gap-3 text-zinc-200">
                <div className="p-2 bg-white/5 rounded-xl text-zinc-400">
                    {icon}
                </div>
                <span className="font-medium text-[15px]">{label}</span>
            </div>
            <div className="flex items-center gap-2">
                {value && <span className="text-sm text-zinc-500">{value}</span>}
                <ChevronRight size={18} className="text-zinc-600" />
            </div>
        </button>
    );
}
