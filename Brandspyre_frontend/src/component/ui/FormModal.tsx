import React from "react";
import { Modal, type ModalProps } from "../Modal";
import { Button } from "./Button";

export interface FormModalProps extends Omit<ModalProps, "footer"> {
  onSubmit: (e: React.FormEvent) => void;
  submitLabel?: string;
  cancelLabel?: string;
  isSubmitting?: boolean;
  submitDisabled?: boolean;
  extraFooterActions?: React.ReactNode;
}

export const FormModal: React.FC<FormModalProps> = ({
  isVisible,
  onClose,
  title,
  subtitle,
  children,
  onSubmit,
  submitLabel = "Save Changes",
  cancelLabel = "Cancel",
  isSubmitting = false,
  submitDisabled = false,
  maxWidth = "2xl",
  extraFooterActions,
  className = "",
}) => {
  const footer = (
    <div className="flex items-center justify-between w-full">
      <div>{extraFooterActions}</div>
      <div className="flex items-center gap-2.5">
        <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
          {cancelLabel}
        </Button>
        <Button type="submit" form="modal-form" isLoading={isSubmitting} disabled={submitDisabled}>
          {submitLabel}
        </Button>
      </div>
    </div>
  );

  return (
    <Modal
      isVisible={isVisible}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      maxWidth={maxWidth}
      className={className}
      footer={footer}
    >
      <form id="modal-form" onSubmit={onSubmit} className="space-y-4">
        {children}
      </form>
    </Modal>
  );
};

export default FormModal;
