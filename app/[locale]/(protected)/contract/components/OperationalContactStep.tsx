"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, User } from "lucide-react";
import { ContractFormData, OperationalContact } from "./types";

interface OperationalContactStepProps {
    formData: ContractFormData;
    onContactsChange: (contacts: OperationalContact[]) => void;
}

export const OperationalContactStep = ({
    formData,
    onContactsChange,
}: OperationalContactStepProps) => {
    const handleAddContact = () => {
        const newContact: OperationalContact = {
            id: Date.now(),
            name: "",
            title: "",
            phoneNo: "",
            email: "",
        };
        onContactsChange([...formData.operationalContacts, newContact]);
    };

    const handleDeleteContact = (contactId: number | string) => {
        const updatedContacts = formData.operationalContacts.filter(
            (contact) => contact.id !== contactId
        );
        onContactsChange(updatedContacts);
    };

    const handleContactChange = (
        contactId: number | string,
        field: keyof OperationalContact,
        value: string
    ) => {
        const updatedContacts = formData.operationalContacts.map((contact) => {
            if (contact.id === contactId) {
                return { ...contact, [field]: value };
            }
            return contact;
        });
        onContactsChange(updatedContacts);
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-end">

                {formData.operationalContacts.length >= 1 && (
                    <Button onClick={handleAddContact} size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Contact
                    </Button>
                )}
            </div>

            {/* Empty State */}
            {formData.operationalContacts.length === 0 ? (
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                    <div className="flex flex-col items-center gap-3">
                        <div className="rounded-full bg-primary/10 p-3">
                            <User className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg">No Contacts</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                Add operational contacts for communication
                            </p>
                        </div>
                        <Button onClick={handleAddContact} className="mt-2">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Contact
                        </Button>
                    </div>
                </div>
            ) : (
                /* Contact Cards */
                <div className="space-y-3">
                    {formData.operationalContacts.map((contact, index) => (
                        <div
                            key={contact.id}
                            className="border rounded-lg p-4 bg-muted/30"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <span className="font-medium text-sm">
                                    Contact #{index + 1}
                                </span>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                    onClick={() => handleDeleteContact(contact.id)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor={`name-${contact.id}`}>Name</Label>
                                    <Input
                                        id={`name-${contact.id}`}
                                        placeholder="Enter name"
                                        value={contact.name}
                                        onChange={(e) =>
                                            handleContactChange(contact.id, "name", e.target.value)
                                        }
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor={`title-${contact.id}`}>Title</Label>
                                    <Input
                                        id={`title-${contact.id}`}
                                        placeholder="Enter title"
                                        value={contact.title}
                                        onChange={(e) =>
                                            handleContactChange(contact.id, "title", e.target.value)
                                        }
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor={`phoneNo-${contact.id}`}>Phone No.</Label>
                                    <Input
                                        id={`phoneNo-${contact.id}`}
                                        placeholder="Enter phone number"
                                        value={contact.phoneNo}
                                        onChange={(e) =>
                                            handleContactChange(contact.id, "phoneNo", e.target.value)
                                        }
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor={`email-${contact.id}`}>E-mail</Label>
                                    <Input
                                        id={`email-${contact.id}`}
                                        type="email"
                                        placeholder="Enter email"
                                        value={contact.email}
                                        onChange={(e) =>
                                            handleContactChange(contact.id, "email", e.target.value)
                                        }
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
