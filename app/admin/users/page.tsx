"use client";

import { useState, useEffect } from "react";
import { inviteUser, getAllowedUsers, removeAllowedUser, resendInvitation } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Trash2, UserPlus, Mail, RefreshCw, CheckCircle, Clock } from "lucide-react";

type AllowedUser = {
    email: string;
    invited_at: string;
    role: string;
    status?: string;
};

export default function UsersPage() {
    const [users, setUsers] = useState<AllowedUser[]>([]);
    const [newEmail, setNewEmail] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isInviting, setIsInviting] = useState(false);
    const [resendingEmail, setResendingEmail] = useState<string | null>(null);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            const data = await getAllowedUsers();
            // @ts-ignore
            setUsers(data || []);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newEmail) return;

        setIsInviting(true);
        try {
            const result = await inviteUser(newEmail);
            if (result.success) {
                setNewEmail("");
                loadUsers();
                alert(`招待メールを送信しました: ${newEmail}`);
            } else {
                alert(result.error);
            }
        } catch (e) {
            console.error(e);
            alert("エラーが発生しました");
        } finally {
            setIsInviting(false);
        }
    };

    const handleResend = async (email: string) => {
        setResendingEmail(email);
        try {
            const result = await resendInvitation(email);
            if (result.success) {
                alert(`招待メールを再送しました: ${email}`);
            } else {
                alert(result.error);
            }
        } catch (e) {
            console.error(e);
            alert("再送中にエラーが発生しました");
        } finally {
            setResendingEmail(null);
        }
    };

    const handleRemove = async (email: string) => {
        if (!confirm(`${email} の利用許可を取り消し、アカウントを削除しますか？\n(この操作は取り消せません)`)) return;
        try {
            const result = await removeAllowedUser(email);
            if (result.success) {
                loadUsers();
            } else {
                alert(result.error);
            }
        } catch (e) {
            console.error(e);
            alert("エラーが発生しました");
        }
    };

    const getStatusBadge = (status: string | undefined) => {
        if (status === '登録完了') {
            return <span className="inline-flex items-center px-2 py-1 bg-green-50 text-green-700 rounded text-xs font-bold gap-1"><CheckCircle className="w-3 h-3" /> 登録済</span>;
        } else if (status === '招待中') {
            return <span className="inline-flex items-center px-2 py-1 bg-yellow-50 text-yellow-700 rounded text-xs font-bold gap-1"><Clock className="w-3 h-3" /> 招待中</span>;
        } else {
            return <span className="inline-flex items-center px-2 py-1 bg-gray-50 text-gray-500 rounded text-xs font-bold">{status || '不明'}</span>;
        }
    };

    return (
        <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">ユーザー管理</h1>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <UserPlus className="w-5 h-5" /> 新規ユーザー招待
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleInvite} className="flex flex-col md:flex-row gap-4">
                        <Input 
                            type="email" 
                            placeholder="メールアドレス (例: user@company.com)" 
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                            className="flex-1"
                            required
                        />
                        <Button type="submit" disabled={isInviting} className="w-full md:w-auto">
                            {isInviting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            招待を送る
                        </Button>
                    </form>
                    <p className="text-sm text-gray-500 mt-2">
                        ※招待されたユーザーは、Googleアカウントでログインした後、利用規約に同意することでシステムを利用できるようになります。
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Mail className="w-5 h-5" /> 利用許可済みユーザー一覧
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                        </div>
                    ) : users.length === 0 ? (
                        <p className="text-center text-gray-500 py-8">ユーザーがいません</p>
                    ) : (
                        <>
                            {/* モバイル用ビュー（カード形式） */}
                            <div className="md:hidden space-y-4">
                                {users.map((user) => (
                                    <div key={user.email} className="p-4 border rounded-lg bg-white space-y-3 shadow-sm">
                                        <div className="flex justify-between items-start gap-2">
                                            <div className="flex flex-col min-w-0">
                                                <span className="font-medium break-all text-sm">{user.email}</span>
                                                <div className="mt-1">
                                                    {getStatusBadge(user.status)}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-dashed">
                                            <div className="flex flex-col gap-1">
                                                <span>招待: {new Date(user.invited_at).toLocaleDateString()}</span>
                                                <span className="inline-block px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-bold w-fit">
                                                    {user.role}
                                                </span>
                                            </div>
                                            
                                            <div className="flex gap-2 items-center">
                                                {user.status === '招待中' && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleResend(user.email)}
                                                        disabled={resendingEmail === user.email}
                                                        className="h-8 px-2"
                                                    >
                                                        {resendingEmail === user.email ? (
                                                            <Loader2 className="w-3 h-3 animate-spin" />
                                                        ) : (
                                                            <div className="flex items-center gap-1">
                                                                <RefreshCw className="w-3 h-3" />
                                                                <span className="text-xs">再送</span>
                                                            </div>
                                                        )}
                                                    </Button>
                                                )}
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                    onClick={() => handleRemove(user.email)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* PC用ビュー（テーブル形式） */}
                            <div className="hidden md:block border rounded-lg overflow-hidden">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 text-gray-700 font-bold border-b">
                                        <tr>
                                            <th className="p-4">メールアドレス</th>
                                            <th className="p-4">招待日時</th>
                                            <th className="p-4">権限</th>
                                            <th className="p-4 text-right">操作</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {users.map((user) => (
                                            <tr key={user.email} className="bg-white">
                                                <td className="p-4 font-medium">
                                                    <div className="flex flex-col">
                                                        <span>{user.email}</span>
                                                        <span className="mt-1">{getStatusBadge(user.status)}</span>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-gray-500">
                                                    {new Date(user.invited_at).toLocaleDateString()}
                                                </td>
                                                <td className="p-4">
                                                    <span className="inline-block px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-bold">
                                                        {user.role}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        {user.status === '招待中' && (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleResend(user.email)}
                                                                disabled={resendingEmail === user.email}
                                                            >
                                                                {resendingEmail === user.email ? (
                                                                    <Loader2 className="w-3 h-3 animate-spin" />
                                                                ) : (
                                                                    <div className="flex items-center gap-1">
                                                                        <RefreshCw className="w-3 h-3" />
                                                                        <span className="text-xs">再送</span>
                                                                    </div>
                                                                )}
                                                            </Button>
                                                        )}
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                            onClick={() => handleRemove(user.email)}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
