"use client";

import { Button } from "@/components/ui/button";
import React from "react";
import { useStep } from "./step-context";
import { useFieldArray, useForm } from "react-hook-form";
import BasicFileUploader from "@/components/ui/input-file/basic-file-uploader";
import { Input } from "@/components/ui/input";
import { CirclePlus, Trash } from "lucide-react";

type Props = {};
type FormData = {
  attachFile: {
    name: string;
    file: File[] | null;
  }[];
};

const AttachFileStep = (props: Props) => {
  const { goNext, goBack, onSave } = useStep();
  const { control, register, handleSubmit } = useForm<FormData>({
    defaultValues: {
      attachFile: [
        {
          name: "",
          file: null,
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "attachFile",
  });

  const onSubmit = (data: FormData) => {
    console.log("Submit data:", data);
    goNext();
    // router.push('/flight')
    // alert(JSON.stringify(data, null, 2))
  };
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>AttachFileStep</div>
      <div className="mb-4 space-y-4 ">
        {fields.map((item, index) => (
          <div key={index} className="grid grid-cols-4 gap-4">
            <div className="col-span-1">
              <Input type="text" placeholder="File name" />
            </div>
            <div className="col-span-2">
              <Input type="file" id="file" />
            </div>
            <div className="col-span-1">
              <Button
                type="button"
                variant="ghost"
                color="destructive"
                onClick={() => remove(index)}
                size="sm"
                rounded="full"
              >
                <Trash />
              </Button>
              <Button
                type="button"
                variant="ghost"
                color="secondary"
                onClick={() =>
                  append({
                    name: "",
                    file: null,
                  })
                }
                size="sm"
                rounded="full"
              >
                <CirclePlus />
              </Button>
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-between pt-4">
        <Button onClick={goBack} variant="soft">
          Back
        </Button>
        <Button type="submit">Next</Button>
      </div>
    </form>
  );
};

export default AttachFileStep;
