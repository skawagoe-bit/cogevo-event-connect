"use client";

import { useState, useEffect } from "react";
import { inviteUser, getAllowedUsers, removeAllowedUser } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Trash2, UserPlus, Mail } from "lucide-react";

type AllowedUser = {
    email: string;
    invited_at: string;
    role: string;
};

export default function UsersPage() {
    const [users, setUsers] = useState<AllowedUser[]>([]);
    const [newEmail, setNewEmail] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isInviting, setIsInviting] = useState(false);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            const data = await getAllowedUsers();
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
                alert(`招待メールを送信しました（実際はホワイトリストへの追加のみです）: ${newEmail}`);
            } else {
                alert(result.error);
            }
        } catch (e) {
            alert("エラーが発生しました");
        } finally {
            setIsInviting(false);
        }
    };

    const handleRemove = async (email: string) => {
        if (!confirm(`${email} の利用許可を取り消しますか？`)) return;
        try {
            const result = await removeAllowedUser(email);
            if (result.success) {
                loadUsers();
            } else {
                alert(result.error);
            }
        } catch (e) {
            alert("エラーが発生しました");
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8">
            <h1 className="text-3xl font-bold text-gray-800">ユーザー管理</h1>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <UserPlus className="w-5 h-5" /> 新規ユーザー招待
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleInvite} className="flex gap-4">
                        <Input 
                            type="email" 
                            placeholder="メールアドレス (例: user@company.com)" 
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                            className="flex-1"
                            required
                        />
                        <Button type="submit" disabled={isInviting}>
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
                        <div className="border rounded-lg overflow-hidden">
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
                                            <td className="p-4 font-medium">{user.email}</td>
                                            <td className="p-4 text-gray-500">
                                                {new Date(user.invited_at).toLocaleDateString()}
                                            </td>
                                            <td className="p-4">
                                                <span className="inline-block px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-bold">
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                    onClick={() => handleRemove(user.email)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
