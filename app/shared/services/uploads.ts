import { File, sql, tx, session, ValidationError } from "@elements/app";

export interface PostForm {
  photo?: File;
  caption: string;
}

export interface ProfileForm {
  name: string;
  bio: string;
  avatar?: File;
}

// The types the app will store and later serve inline. The serve route checks
// the same list.
export const ALLOWED = ["image/png", "image/jpeg", "image/gif", "image/webp"];

export const MAX_BYTES = 8 * 1024 * 1024;

export const MAX_CAPTION = 2200;

export const MAX_BIO = 300;

function storeImage(f: File): string {
  if (!ALLOWED.includes(f.contentType)) {
    throw new ValidationError("choose a PNG, JPEG, GIF or WebP image");
  }

  if (f.size > MAX_BYTES) {
    throw new ValidationError("that image is over 8 MB");
  }

  return sql<{ id: string }>(`
    insert into images (contentType, data) values (${f.contentType}, ${f.data}) returning id
  `).firstOrThrow().id;
}

/** @rpc */
export function createPost(form: PostForm): string {
  session.isLoggedInOrThrow();

  if (!form.photo) {
    throw new ValidationError("choose a photo to share");
  }

  let caption = form.caption.trim();
  if (caption.length > MAX_CAPTION) {
    throw new ValidationError(`captions are at most ${MAX_CAPTION} characters`);
  }

  let photo = form.photo;

  return tx(() => {
    let imageId = storeImage(photo);

    return sql<{ id: string }>(`
      insert into posts (userId, imageId, caption)
           values (${session.getOrThrow("userId")}::uuid, ${imageId}::uuid, ${caption})
        returning id
    `).firstOrThrow().id;
  });
}

/** @rpc */
export function updateProfile(form: ProfileForm) {
  session.isLoggedInOrThrow();
  let me = session.getOrThrow("userId");

  let name = form.name.trim();
  let bio = form.bio.trim();

  if (name.length > 60) {
    throw new ValidationError("names are at most 60 characters");
  }

  if (bio.length > MAX_BIO) {
    throw new ValidationError(`bios are at most ${MAX_BIO} characters`);
  }

  let avatar = form.avatar;

  tx(() => {
    if (avatar) {
      let old = sql<{ avatarImageId: string | null }>(`
        select avatarImageId from users where id = ${me}::uuid
      `).firstOrThrow();

      let imageId = storeImage(avatar);
      sql(`update users set avatarImageId = ${imageId}::uuid, avatarSeed = null where id = ${me}::uuid`);

      if (old.avatarImageId) {
        sql(`delete from images where id = ${old.avatarImageId}::uuid`);
      }
    }

    sql(`update users set name = ${name}, bio = ${bio} where id = ${me}::uuid`);
  });
}
