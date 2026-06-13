"use client";

import { useUIStore } from "@/store/uiStore";
import { FolderService } from "@/services/folder.service";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as zod from "zod";
import { FolderPlus, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const schema = zod.object({
  name: zod.string().min(1, "Folder name is required").max(50, "Name too long"),
});

type FormData = zod.infer<typeof schema>;

export default function CreateFolderDialog() {
  const { isCreateFolderOpen, setCreateFolderOpen, currentFolderId } = useUIStore();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      FolderService.createFolder({
        name: data.name,
        parentFolderId: currentFolderId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folderTree"] });
      queryClient.invalidateQueries({ queryKey: ["files", currentFolderId] });
      setCreateFolderOpen(false);
      reset();
    },
  });

  const onSubmit = (data: FormData) => {
    mutation.mutate(data);
  };

  const handleClose = () => {
    setCreateFolderOpen(false);
    reset();
  };

  return (
    <AnimatePresence>
      {isCreateFolderOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", duration: 0.3 }}
            className="bg-card border border-border/80 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl relative z-10"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/60 px-6 py-4">
              <div className="flex items-center gap-2.5">
                <FolderPlus className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-lg text-foreground">New Folder</h3>
              </div>
              <button
                onClick={handleClose}
                className="p-1 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-all-custom cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="p-6">
              <div className="space-y-4">
                <div>
                  <label htmlFor="folderName" className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Folder Name
                  </label>
                  <input
                    id="folderName"
                    type="text"
                    placeholder="Enter folder name..."
                    autoFocus
                    {...register("name")}
                    className={`w-full px-4 py-2.5 rounded-xl bg-secondary/50 border ${
                      errors.name ? "border-destructive focus:ring-destructive/20" : "border-border/80 focus:border-primary/50 focus:ring-primary/20"
                    } text-sm focus:outline-none focus:ring-2 focus:ring-offset-0 transition-all duration-200`}
                  />
                  {errors.name && (
                    <span className="text-xs text-destructive mt-1.5 block">
                      {errors.name.message}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-sm font-semibold rounded-xl bg-secondary hover:bg-secondary/80 border border-border/60 hover:text-foreground transition-all-custom cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={mutation.isPending}
                  className="px-5 py-2 text-sm font-semibold text-white rounded-xl bg-primary hover:bg-primary/95 shadow-md shadow-primary/20 hover:shadow-primary/30 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {mutation.isPending ? "Creating..." : "Create Folder"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
