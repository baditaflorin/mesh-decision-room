export default async function scenario(a, b) {
  await a.getByLabel("Your name").fill("Ava");
  await b.getByLabel("Your name").fill("Mika");

  await a.getByLabel("First option").fill("The courtyard table");
  await a.getByRole("button", { name: "Add this option", exact: true }).click();
  await b.getByText("The courtyard table", { exact: true }).first().waitFor();

  await a.getByLabel("Add another option").fill("The 8 pm film");
  await a.getByRole("button", { name: "Add option", exact: true }).click();
  await b.getByText("The 8 pm film", { exact: true }).first().waitFor();

  await a.getByRole("button", { name: "Rank The courtyard table", exact: true }).click();
  await a.getByRole("button", { name: "Rank The 8 pm film", exact: true }).click();
  await b.getByRole("button", { name: "Rank The 8 pm film", exact: true }).click();
  await b.getByRole("button", { name: "Rank The courtyard table", exact: true }).click();
  await a.waitForTimeout(1200);
}
