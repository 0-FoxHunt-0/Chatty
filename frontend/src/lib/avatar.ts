import { createAvatar } from "@dicebear/core";
import { initials } from "@dicebear/collection";

/**
 * Generates a random Initials SVG avatar using DiceBear
 * @param fullName - User's full name to extract initials from
 * @returns SVG string representation of the avatar
 */
export const generateInitialsAvatar = (fullName: string): string => {
  // Use the user's name as the seed for deterministic avatars
  // Same name will always generate the same avatar
  const seed = fullName.trim() || "User";

  // Create avatar with initials style
  const avatar = createAvatar(initials, {
    seed: seed,
    size: 128,
  });

  return avatar.toString();
};

/**
 * Converts SVG string to base64 data URL format
 * @param svg - SVG string to convert
 * @returns Base64 data URL string
 */
export const svgToBase64 = (svg: string): string => {
  const bytes = new TextEncoder().encode(svg);
  const binary = String.fromCharCode(...bytes);
  const base64 = btoa(binary);
  return `data:image/svg+xml;base64,${base64}`;
};

/**
 * Main function that generates avatar, converts to base64, and uploads via updateProfile API
 * @param fullName - User's full name to extract initials from
 * @param email - User's email (required for updateProfile)
 * @param updateProfile - Function to call the updateProfile API
 * @param bio - Optional user's bio
 * @returns Promise that resolves when avatar is uploaded
 */
export const generateAndUploadAvatar = async (
  fullName: string,
  email: string,
  updateProfile: (formData: {
    fullName: string;
    email: string;
    bio?: string;
    profilePicture?: string;
  }) => Promise<void>,
  bio?: string
): Promise<void> => {
  try {
    // Generate SVG avatar
    const svg = generateInitialsAvatar(fullName);

    // Convert to base64 data URL
    const base64DataUrl = svgToBase64(svg);

    // Call updateProfile with current user data and new avatar
    await updateProfile({
      fullName: fullName,
      email: email,
      bio: bio,
      profilePicture: base64DataUrl,
    });
  } catch (error) {
    console.error("Error generating and uploading avatar:", error);
    throw error;
  }
};
