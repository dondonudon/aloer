import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Pagination } from "@/components/ui/pagination";

// Mock next/link so it renders a plain <a> in the jsdom environment.
vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// Mock lucide-react icons used inside Pagination.
vi.mock("lucide-react", () => ({
  ChevronLeft: () => <svg data-testid="icon-prev" />,
  ChevronRight: () => <svg data-testid="icon-next" />,
}));

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

const buildHref = (p: number) => `/items?page=${p}`;
const buildLimitHref = (limit: number) => `/items?limit=${limit}`;

describe("Pagination", () => {
  it("renders nothing when totalPages is 1", () => {
    const { container } = render(
      <Pagination page={1} totalPages={1} buildHref={buildHref} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when totalPages is 0", () => {
    const { container } = render(
      <Pagination page={1} totalPages={0} buildHref={buildHref} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders a nav landmark", () => {
    render(<Pagination page={1} totalPages={3} buildHref={buildHref} />);
    expect(
      screen.getByRole("navigation", { name: /pagination/i }),
    ).toBeInTheDocument();
  });

  it("marks the current page with aria-current='page'", () => {
    render(<Pagination page={2} totalPages={3} buildHref={buildHref} />);
    const currentLink = screen.getByRole("link", { name: /page 2/i });
    expect(currentLink).toHaveAttribute("aria-current", "page");
  });

  it("other page links do not have aria-current", () => {
    render(<Pagination page={2} totalPages={3} buildHref={buildHref} />);
    const link1 = screen.getByRole("link", { name: /page 1/i });
    expect(link1).not.toHaveAttribute("aria-current");
  });

  it("previous link is disabled on the first page", () => {
    render(<Pagination page={1} totalPages={3} buildHref={buildHref} />);
    const disabled = screen.getByLabelText(/previous page \(disabled\)/i);
    expect(disabled).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /previous page/i })).toBeNull();
  });

  it("next link is disabled on the last page", () => {
    render(<Pagination page={3} totalPages={3} buildHref={buildHref} />);
    const disabled = screen.getByLabelText(/next page \(disabled\)/i);
    expect(disabled).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /next page/i })).toBeNull();
  });

  it("previous page link points to page - 1", () => {
    render(<Pagination page={3} totalPages={5} buildHref={buildHref} />);
    const prev = screen.getByRole("link", { name: /previous page/i });
    expect(prev).toHaveAttribute("href", "/items?page=2");
  });

  it("next page link points to page + 1", () => {
    render(<Pagination page={3} totalPages={5} buildHref={buildHref} />);
    const next = screen.getByRole("link", { name: /next page/i });
    expect(next).toHaveAttribute("href", "/items?page=4");
  });

  it("shows an ellipsis when there are many pages and current page is in the middle", () => {
    render(<Pagination page={10} totalPages={20} buildHref={buildHref} />);
    // Should show 1 … 8 9 10 11 12 … 20
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("20")).toBeInTheDocument();
    expect(screen.getAllByText("…").length).toBeGreaterThan(0);
  });

  it("all page links use the href from buildHref", () => {
    render(<Pagination page={1} totalPages={3} buildHref={buildHref} />);
    expect(screen.getByRole("link", { name: /page 1/i })).toHaveAttribute(
      "href",
      "/items?page=1",
    );
    expect(screen.getByRole("link", { name: /page 2/i })).toHaveAttribute(
      "href",
      "/items?page=2",
    );
    expect(screen.getByRole("link", { name: /page 3/i })).toHaveAttribute(
      "href",
      "/items?page=3",
    );
  });

  describe("rows-per-page dropdown", () => {
    it("renders a rows-per-page select when pageSize and buildLimitHref are provided", () => {
      render(
        <Pagination
          page={1}
          totalPages={3}
          buildHref={buildHref}
          pageSize={10}
          buildLimitHref={buildLimitHref}
        />,
      );
      expect(
        screen.getByRole("combobox", { name: /rows per page/i }),
      ).toBeInTheDocument();
    });

    it("does not render a rows-per-page select without pageSize/buildLimitHref", () => {
      render(<Pagination page={1} totalPages={3} buildHref={buildHref} />);
      expect(
        screen.queryByRole("combobox", { name: /rows per page/i }),
      ).toBeNull();
    });

    it("select shows the current pageSize as the selected value", () => {
      render(
        <Pagination
          page={1}
          totalPages={5}
          buildHref={buildHref}
          pageSize={20}
          buildLimitHref={buildLimitHref}
        />,
      );
      const select = screen.getByRole("combobox", {
        name: /rows per page/i,
      }) as HTMLSelectElement;
      expect(select.value).toBe("20");
    });

    it("select contains options 10, 20, 50, 100", () => {
      render(
        <Pagination
          page={1}
          totalPages={3}
          buildHref={buildHref}
          pageSize={10}
          buildLimitHref={buildLimitHref}
        />,
      );
      const options = screen
        .getAllByRole("option")
        .map((o) => (o as HTMLOptionElement).value);
      expect(options).toEqual(["10", "20", "50", "100"]);
    });

    it("calls router.push with buildLimitHref result when limit changes", async () => {
      mockPush.mockClear();
      render(
        <Pagination
          page={1}
          totalPages={3}
          buildHref={buildHref}
          pageSize={10}
          buildLimitHref={buildLimitHref}
        />,
      );
      const select = screen.getByRole("combobox", { name: /rows per page/i });
      await userEvent.selectOptions(select, "50");
      expect(mockPush).toHaveBeenCalledWith("/items?limit=50");
    });

    it("renders the dropdown even when totalPages is 1", () => {
      render(
        <Pagination
          page={1}
          totalPages={1}
          buildHref={buildHref}
          pageSize={10}
          buildLimitHref={buildLimitHref}
        />,
      );
      expect(
        screen.getByRole("combobox", { name: /rows per page/i }),
      ).toBeInTheDocument();
      // nav should not be present when there's only 1 page
      expect(
        screen.queryByRole("navigation", { name: /pagination/i }),
      ).toBeNull();
    });
  });
});
