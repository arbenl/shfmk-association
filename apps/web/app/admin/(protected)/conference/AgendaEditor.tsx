"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Trash2, Plus, Code } from "lucide-react";

interface Session {
    time: string;
    title: string;
    speaker?: string;
    description?: string;
}

interface AgendaEditorProps {
    initialData: any;
    name: string;
}

export function AgendaEditor({ initialData, name }: AgendaEditorProps) {
    const [mode, setMode] = useState<"form" | "json">("form");
    const [sessions, setSessions] = useState<Session[]>([]);
    const [jsonError, setJsonError] = useState<string | null>(null);
    const [jsonValue, setJsonValue] = useState<string>("[]");

    // Initialize state
    useEffect(() => {
        let data = initialData;
        if (typeof data === "string") {
            try {
                data = JSON.parse(data);
            } catch (e) {
                data = [];
            }
        }
        if (!Array.isArray(data)) data = [];

        setSessions(data);
        setJsonValue(JSON.stringify(data, null, 2));
    }, [initialData]);

    // Sync Form -> JSON
    const updateSessions = (newSessions: Session[]) => {
        setSessions(newSessions);
        setJsonValue(JSON.stringify(newSessions, null, 2));
    };

    // Sync JSON -> Form
    const handleJsonChange = (val: string) => {
        setJsonValue(val);
        try {
            const parsed = JSON.parse(val);
            if (Array.isArray(parsed)) {
                setSessions(parsed);
                setJsonError(null);
            } else {
                setJsonError("Must be an array of sessions");
            }
        } catch (e) {
            setJsonError("Invalid JSON format");
        }
    };

    const addSession = () => {
        updateSessions([...sessions, { time: "", title: "", speaker: "" }]);
    };

    const removeSession = (index: number) => {
        const newSessions = [...sessions];
        newSessions.splice(index, 1);
        updateSessions(newSessions);
    };

    const updateSession = (index: number, field: keyof Session, value: string) => {
        const newSessions = [...sessions];
        newSessions[index] = { ...newSessions[index], [field]: value };
        updateSessions(newSessions);
    };

    return (
        <div className="space-y-4 border rounded-md p-4 bg-gray-50/50">
            <div className="flex items-center justify-between mb-4">
                <Label className="text-base font-semibold">Agjenda e Konferencës</Label>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Advanced JSON</span>
                    <Switch
                        checked={mode === "json"}
                        onCheckedChange={(c) => setMode(c ? "json" : "form")}
                    />
                </div>
            </div>

            {/* Hidden input to submit the actual JSON string */}
            <input type="hidden" name={name} value={jsonValue} />
            <input type="hidden" name="agenda_json_error" value={jsonError ?? ""} />

            {mode === "json" ? (
                <div className="space-y-2">
                    <Textarea
                        value={jsonValue}
                        onChange={(e) => handleJsonChange(e.target.value)}
                        className="font-mono text-sm h-[400px]"
                    />
                    {jsonError && <p className="text-red-500 text-sm">Gabim në JSON — ruajtja është e bllokuar derisa të rregullohet.</p>}
                </div>
            ) : (
                <div className="space-y-4">
                    {sessions.map((session, idx) => (
                        <div key={idx} className="space-y-3 rounded border bg-white p-3 shadow-sm">
                            <div className="grid gap-2 md:grid-cols-12">
                                <div className="md:col-span-2">
                                    <Label className="text-xs text-muted-foreground">Ora</Label>
                                    <Input
                                        value={session.time}
                                        onChange={(e) => updateSession(idx, "time", e.target.value)}
                                        placeholder="09:00"
                                    />
                                </div>
                                <div className="md:col-span-5">
                                    <Label className="text-xs text-muted-foreground">Titulli / Tema</Label>
                                    <Input
                                        value={session.title}
                                        onChange={(e) => updateSession(idx, "title", e.target.value)}
                                        placeholder="Hapja e konferencës"
                                    />
                                </div>
                                <div className="md:col-span-4">
                                    <Label className="text-xs text-muted-foreground">Folësi (Opsional)</Label>
                                    <Input
                                        value={session.speaker || ""}
                                        onChange={(e) => updateSession(idx, "speaker", e.target.value)}
                                        placeholder="Dr. Emri Mbiemri"
                                    />
                                </div>
                                <div className="md:col-span-1 flex items-end justify-end">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                        onClick={() => removeSession(idx)}
                                        aria-label="Fshi sesionin"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                            <div className="grid gap-2 md:grid-cols-12">
                                <div className="md:col-span-12">
                                    <Label className="text-xs text-muted-foreground">Përshkrim (Opsional)</Label>
                                    <Textarea
                                        value={session.description || ""}
                                        onChange={(e) => updateSession(idx, "description", e.target.value)}
                                        placeholder="Shto përmbledhje, objektiva, detaje teknike..."
                                        className="min-h-[140px] resize-y"
                                    />
                                </div>
                            </div>
                        </div>
                    ))}

                    <Button type="button" variant="outline" onClick={addSession} className="w-full border-dashed">
                        <Plus className="h-4 w-4 mr-2" />
                        Shto Sesion
                    </Button>
                </div>
            )}
        </div>
    );
}
