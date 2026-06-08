"use client";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { GoogleFont } from "@/lib/fonts";
import { fetchGoogleFonts, loadFont } from "@/lib/fonts";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown, Filter } from "lucide-react";
import * as React from "react";
import { List, type RowComponentProps } from "react-window";

interface FontPickerState {
  selectedFont: GoogleFont | null;
  search: string;
  isOpen: boolean;
  selectedCategory: string;
  fonts: GoogleFont[];
  isLoading: boolean;
  error: Error | null;
}

const initialFontPickerState: FontPickerState = {
  selectedFont: null,
  search: "",
  isOpen: false,
  selectedCategory: "all",
  fonts: [],
  isLoading: true,
  error: null,
};

type FontPickerAction =
  | { type: "LOAD_SUCCESS"; fonts: GoogleFont[]; selectedValue?: string }
  | { type: "LOAD_ERROR"; error: Error }
  | { type: "SET_SEARCH"; value: string }
  | { type: "SET_OPEN"; open: boolean }
  | { type: "SET_CATEGORY"; category: string }
  | { type: "SELECT_FONT"; font: GoogleFont };

function fontPickerReducer(
  state: FontPickerState,
  action: FontPickerAction,
): FontPickerState {
  switch (action.type) {
    case "LOAD_SUCCESS":
      return {
        ...state,
        fonts: action.fonts,
        selectedFont:
          action.fonts.find((f) => f.family === action.selectedValue) ?? null,
        error: null,
        isLoading: false,
      };
    case "LOAD_ERROR":
      return { ...state, error: action.error, isLoading: false };
    case "SET_SEARCH":
      return { ...state, search: action.value };
    case "SET_OPEN":
      return { ...state, isOpen: action.open };
    case "SET_CATEGORY":
      return { ...state, selectedCategory: action.category };
    case "SELECT_FONT":
      return { ...state, selectedFont: action.font };
  }
}

const RowComponent = ({
  index,
  style,
  fonts,
  selectedFont,
  onSelectFont,
  localePangram,
}: RowComponentProps<{
  fonts: GoogleFont[];
  selectedFont: GoogleFont | null;
  onSelectFont: (font: GoogleFont) => void;
  localePangram?: string;
}>) => {
  const font = fonts[index];
  return (
    <div style={style}>
      <FontListItem
        font={font}
        isSelected={selectedFont?.family === font.family}
        onSelect={() => onSelectFont(font)}
        localePangram={localePangram}
      />
    </div>
  );
};

function FontListItem({
  font,
  isSelected,
  onSelect,
  localePangram,
}: {
  font: GoogleFont;
  isSelected: boolean;
  onSelect: () => void;
  localePangram?: string;
}) {
  const isFontLoaded = isSelected;

  return (
    <CommandItem
      value={font.family}
      onSelect={onSelect}
      className="data-[selected=true]:bg-accent flex cursor-pointer items-center gap-2 p-2"
      data-selected={isSelected}
    >
      <Check
        className={cn(
          "h-3 w-3 shrink-0",
          isSelected ? "opacity-100" : "opacity-0",
        )}
      />
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-medium">{font.family}</span>
        {localePangram ? (
          <>
            <span
              className={cn(
                "text-muted-foreground text-xs leading-relaxed transition-opacity duration-300",
                isFontLoaded ? "opacity-100" : "opacity-0",
              )}
              style={{
                fontFamily: isFontLoaded ? font.family : "system-ui",
              }}
            >
              {localePangram}
            </span>
            <span
              className={cn(
                "text-muted-foreground/60 text-xs leading-relaxed transition-opacity duration-300",
                isFontLoaded ? "opacity-100" : "opacity-0",
              )}
              style={{
                fontFamily: isFontLoaded ? font.family : "system-ui",
              }}
            >
              The quick brown fox
            </span>
          </>
        ) : (
          <span
            className={cn(
              "text-muted-foreground text-xs transition-opacity duration-300",
              isFontLoaded ? "opacity-100" : "opacity-0",
            )}
            style={{
              fontFamily: isFontLoaded ? font.family : "system-ui",
            }}
          >
            The quick brown fox
          </span>
        )}
      </div>
    </CommandItem>
  );
}

interface FontPickerProps {
  onChange?: (font: GoogleFont["family"]) => void;
  value?: string;
  width?: number;
  height?: number;
  className?: string;
  showFilters?: boolean;
  localePangram?: string;
}

async function fetchFonts() {
  try {
    const fonts = await fetchGoogleFonts();
    return { success: true as const, fonts };
  } catch (err) {
    return {
      success: false as const,
      error: err instanceof Error ? err : new Error("Failed to load fonts"),
    };
  }
}

export function FontPicker({
  onChange,
  value,
  width = 300,
  height = 300,
  className,
  showFilters = true,
  localePangram,
}: FontPickerProps) {
  const [state, dispatch] = React.useReducer(
    fontPickerReducer,
    initialFontPickerState,
  );

  React.useEffect(() => {
    let cancelled = false;

    fetchFonts().then((result) => {
      if (cancelled) return;
      dispatch(
        result.success
          ? { type: "LOAD_SUCCESS", fonts: result.fonts, selectedValue: value }
          : { type: "LOAD_ERROR", error: result.error },
      );
    });

    return () => {
      cancelled = true;
    };
  }, [value]);

  const uniqueCategories = new Set(state.fonts.map((font) => font.category));
  const categories = Array.from(uniqueCategories).sort();

  const filteredFonts = state.fonts.filter((font: GoogleFont) => {
    const matchesSearch = font.family
      .toLowerCase()
      .includes(state.search.toLowerCase());
    const matchesCategory =
      !showFilters ||
      state.selectedCategory === "all" ||
      font.category === state.selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSelectFont = (font: GoogleFont) => {
    dispatch({ type: "SELECT_FONT", font });
    loadFont(font.family, font).catch(() => {});
    onChange?.(font.family);
    dispatch({ type: "SET_OPEN", open: false });
  };

  return (
    <Popover
      open={state.isOpen}
      onOpenChange={(open) => dispatch({ type: "SET_OPEN", open })}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={state.isOpen}
          aria-haspopup="listbox"
          aria-controls="font-picker-listbox"
          aria-label="Select font"
          className={cn("group relative justify-between", className)}
          style={{ width }}
        >
          <span className="truncate">
            {state.selectedFont
              ? filteredFonts.find(
                  (font) => font.family === state.selectedFont!.family,
                )?.family
              : "Select font..."}
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0" style={{ width, height }} align="start">
        <Command id="font-picker-listbox">
          <CommandInput
            placeholder="Search fonts..."
            value={state.search}
            onValueChange={(value) =>
              dispatch({ type: "SET_SEARCH", value })
            }
            className="border-none focus:ring-0"
          />
          <div className="flex items-center justify-between gap-2 border-b px-3 py-1">
            {showFilters && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="hover:bg-accent flex h-8 items-center gap-2 px-2"
                  >
                    <Filter className="text-muted-foreground h-4 w-4" />
                    <span className="text-sm capitalize">
                      {state.selectedCategory === "all"
                        ? "All Categories"
                        : state.selectedCategory}
                    </span>
                    <ChevronsUpDown className="ml-2 h-3 w-3 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[200px]">
                  <DropdownMenuRadioGroup
                    value={state.selectedCategory}
                    onValueChange={(value) =>
                      dispatch({ type: "SET_CATEGORY", category: value })
                    }
                  >
                    <DropdownMenuRadioItem value="all">
                      All Categories
                    </DropdownMenuRadioItem>
                    {categories.map((category) => (
                      <DropdownMenuRadioItem
                        key={category}
                        value={category}
                        className="capitalize"
                      >
                        {category}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <span className="text-muted-foreground text-xs">
              {filteredFonts.length} fonts
            </span>
          </div>
          {state.isLoading ? (
            <div className="flex items-center justify-center p-4">
              <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-gray-900" />
            </div>
          ) : state.error ? (
            <div className="flex items-center justify-center p-4 text-sm text-red-500">
              Failed to load fonts. Please try again later.
            </div>
          ) : (
            <>
              <CommandEmpty>No fonts found.</CommandEmpty>
              <CommandGroup>
                <div style={{ height: height - 80 }}>
                  <List
                    rowComponent={RowComponent}
                    rowCount={filteredFonts.length}
                    rowHeight={localePangram ? 75 : 55}
                    rowProps={{
                      fonts: filteredFonts,
                      selectedFont: state.selectedFont,
                      onSelectFont: handleSelectFont,
                      localePangram,
                    }}
                  />
                </div>
              </CommandGroup>
            </>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
}
