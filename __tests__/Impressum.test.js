import "@testing-library/jest-dom/extend-expect";
import { render, cleanup, fireEvent } from "@testing-library/svelte";
import Impressum from "../src/Components/Impressum.svelte";

afterEach(cleanup);

describe("LandingPage", () => {
    it("should be rendered", async () => {
        const result = render(Impressum);
        expect(result).toBeTruthy();
    });
    it("should render ImpressumBox when clicking the button", async () => {
        render(Impressum);
        expect(document.querySelector("#impressum-box")).not.toBeTruthy();
        await fireEvent.click(document.querySelector("#impressumButton"));
        expect(document.querySelector("#impressum-box")).toBeTruthy();
    });
    it("should close ImpressumBox when clicking the close button", async () => {
        render(Impressum);
        expect(document.querySelector("#impressum-box")).not.toBeTruthy();
        await fireEvent.click(document.querySelector("#impressumButton"));
        expect(document.querySelector("#impressum-box")).toBeTruthy();
        await fireEvent.click(document.querySelector("#closeButton"));
        expect(document.querySelector("#impressum-box")).not.toBeTruthy();
    });
});
