import { useRef } from "react";
import { useForm } from "react-hook-form";
import { useChatStore } from "../store/useChatStore";
import { Image, Send, X } from "lucide-react";
import { showToast } from "../lib/toast";

interface MessageFormData {
  text: string;
  image: FileList | null;
}

const MessageInput = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { selectedUser, sendMessage, addMessage } = useChatStore();
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { isSubmitting },
  } = useForm<MessageFormData>({
    defaultValues: {
      text: "",
      image: null,
    },
  });

  const image = watch("image");
  const text = watch("text");
  const imageFile = image?.[0] || null;

  const { ref: imageInputRef, onChange: onImageInputChange } =
    register("image");

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) {
      showToast.error("Please select an image file");
      return;
    }
    onImageInputChange(e);
  };

  const removeImage = () => {
    setValue("image", null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const onSubmit = async (data: MessageFormData) => {
    if (!data.text.trim() && !data.image) return;

    if (!selectedUser?._id) return;

    try {
      let imageBase64: string | undefined;
      if (data.image?.[0]) {
        const reader = new FileReader();
        imageBase64 = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(data.image![0]);
        });
      }

      const response = await sendMessage(
        { text: data.text, image: imageBase64 },
        selectedUser
      );
      if (response) {
        addMessage(response);
      }
      reset();
    } catch (error) {
      console.error("Failed to send message", error);
    }
  };

  return (
    <div className="p-4 w-full">
      {imageFile && (
        <div className="mb-3 flex items-center gap-2">
          <div className="relative">
            <img
              src={URL.createObjectURL(imageFile)}
              alt="Preview"
              className="w-20 h-20 object-cover rounded-lg border border-zinc-700"
            />
            <button
              onClick={removeImage}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-base-300
              flex items-center justify-center"
              type="button"
            >
              <X className="size-3 cursor-pointer hover:text-red-600" />
            </button>
          </div>
        </div>
      )}

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex items-center gap-2"
      >
        <div className="flex-1 flex gap-2">
          <input
            type="text"
            className="w-full input input-bordered rounded-lg input-sm sm:input-md"
            placeholder="Type a message..."
            {...register("text")}
          />
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={(e) => {
              fileInputRef.current = e;
              imageInputRef(e);
            }}
            onChange={handleImageChange}
          />

          <button
            type="button"
            className={`hidden sm:flex btn btn-circle
                     ${imageFile ? "text-emerald-500" : "text-zinc-400"}`}
            onClick={() => fileInputRef.current?.click()}
          >
            <Image size={20} />
          </button>
        </div>
        <button
          type="submit"
          className="btn btn-circle flex items-center justify-center"
          disabled={(!text.trim() && !imageFile) || isSubmitting}
        >
          <Send size={20} />
        </button>
      </form>
    </div>
  );
};

export default MessageInput;
