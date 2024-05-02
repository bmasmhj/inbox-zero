"use client";

import useSWR, { KeyedMutator } from "swr";
import { PlusIcon, TrashIcon } from "lucide-react";
import { useState, useCallback } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { toastSuccess, toastError } from "@/components/Toast";
import { GroupItemsResponse } from "@/app/api/user/group/[groupId]/items/route";
import { LoadingContent } from "@/components/LoadingContent";
import { Modal, useModal } from "@/components/Modal";
import { Button, ButtonLoader } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { MessageText } from "@/components/Typography";
import {
  addGroupItemAction,
  deleteGroupAction,
  deleteGroupItemAction,
} from "@/utils/actions";
import { GroupItemType } from "@prisma/client";
import { Input } from "@/components/Input";
import { Select } from "@/components/Select";
import { zodResolver } from "@hookform/resolvers/zod";
import { AddGroupItemBody, addGroupItemBody } from "@/utils/actions-validation";

export function ViewGroupButton({
  groupId,
  name,
  ButtonComponent,
}: {
  groupId: string;
  name: string;
  ButtonComponent?: React.ComponentType<{ onClick: () => void }>;
}) {
  const { isModalOpen, openModal, closeModal } = useModal();

  return (
    <>
      {ButtonComponent ? (
        <ButtonComponent onClick={openModal} />
      ) : (
        <Button size="sm" variant="outline" onClick={openModal}>
          View
        </Button>
      )}
      <Modal
        isOpen={isModalOpen}
        hideModal={closeModal}
        title={name}
        size="4xl"
      >
        <div className="mt-4">
          <ViewGroup groupId={groupId} />
        </div>
      </Modal>
    </>
  );
}

function ViewGroup({ groupId }: { groupId: string }) {
  const { data, isLoading, error, mutate } = useSWR<GroupItemsResponse>(
    `/api/user/group/${groupId}/items`,
  );

  const [showAddItem, setShowAddItem] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-end space-x-2">
        {showAddItem ? (
          <AddGroupItemForm groupId={groupId} mutate={mutate} />
        ) : (
          <>
            <Button variant="outline" onClick={() => setShowAddItem(true)}>
              <PlusIcon className="mr-2 h-4 w-4" />
              Add Item
            </Button>
            <Button
              variant="outline"
              onClick={async () => {
                if (confirm("Are you sure you want to delete this group?")) {
                  await deleteGroupAction(groupId);
                }
              }}
            >
              <TrashIcon className="mr-2 h-4 w-4" />
              Delete Group
            </Button>
          </>
        )}
      </div>

      <div className="mt-4">
        <LoadingContent
          loading={!data && isLoading}
          error={error}
          loadingComponent={<Skeleton className="h-24 rounded" />}
        >
          {data && (
            <>
              {data.items.length ? (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Sender</TableHead>
                        <TableHead />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data?.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            {item.type === GroupItemType.SUBJECT && "Subject: "}
                            {item.value}
                          </TableCell>
                          <TableCell className="py-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={async () => {
                                await deleteGroupItemAction(item.id);
                              }}
                            >
                              <TrashIcon className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </>
              ) : (
                <MessageText className="mt-4">
                  There are no senders in this group.
                </MessageText>
              )}
            </>
          )}
        </LoadingContent>
      </div>
    </div>
  );
}

const AddGroupItemForm = ({
  groupId,
  mutate,
}: {
  groupId: string;
  mutate: KeyedMutator<GroupItemsResponse>;
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AddGroupItemBody>({
    resolver: zodResolver(addGroupItemBody),
    defaultValues: { groupId },
  });

  const onSubmit: SubmitHandler<AddGroupItemBody> = useCallback(
    async (data) => {
      try {
        await addGroupItemAction(data);
        toastSuccess({ description: `Item added to group!` });
      } catch (error) {
        console.error(error);
        toastError({ description: `Error adding item to group!` });
      }
      mutate();
    },
    [mutate],
  );

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex items-center space-x-2"
    >
      <Select
        name="type"
        label=""
        options={[
          { label: "From", value: GroupItemType.FROM },
          { label: "Subject", value: GroupItemType.SUBJECT },
        ]}
        registerProps={register("type", { required: true })}
        error={errors.type}
      />
      <Input
        type="text"
        name="value"
        placeholder="eg. elie@getinboxzero.com"
        registerProps={register("value", { required: true })}
        error={errors.value}
        className="min-w-[250px]"
      />
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting && <ButtonLoader />}
        Add
      </Button>
    </form>
  );
};
