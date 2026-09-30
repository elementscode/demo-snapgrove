import { test, assert, equal, sql, File, ValidationError } from "@elements/app";
import { createPost } from "#app/shared/services/uploads";
import { makeUser, signIn } from "#app/shared/services/fixtures";

// The eight bytes every PNG starts with; enough for storage, not for display.
const PNG = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);

function file(contentType: string): File {
  return { name: "photo", contentType, size: PNG.length, data: PNG } as unknown as File;
}

test("new post", () => {
  test("stores the photo and the caption", () => {
    let me = makeUser("me");
    signIn(me);

    let id = createPost({ photo: file("image/png"), caption: "  first light  " });

    let row = sql<{ caption: string; contentType: string }>(`
      select p.caption, i.contentType from posts p join images i on i.id = p.imageId where p.id = ${id}::uuid
    `).firstOrThrow();

    equal(row.caption, "first light");
    equal(row.contentType, "image/png");
  });

  test("refuses a file that is not an image", () => {
    let me = makeUser("me");
    signIn(me);

    let threw = false;
    try {
      createPost({ photo: file("text/html"), caption: "" });
    } catch (err) {
      threw = true;
      assert(err instanceof ValidationError, `got ${err}`);
    }

    assert(threw);
    equal(sql(`select 1 from images`).all().length, 0);
  });
});
