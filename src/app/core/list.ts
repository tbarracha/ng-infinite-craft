export class List<T> {
    private items: T[] = [];

    // Add an item to the list
    add(item: T): void {
        this.items.push(item);
    }

    // Add multiple items to the list
    addRange(items: T[]): void {
        this.items.push(...items);
    }

    // Remove the first occurrence of an item
    remove(item: T): boolean {
        const index = this.items.indexOf(item);
        if (index !== -1) {
            this.items.splice(index, 1);
            return true;
        }
        return false;
    }

    // Remove an item at a specific index
    removeAt(index: number): void {
        if (index >= 0 && index < this.items.length) {
            this.items.splice(index, 1);
        } else {
            throw new RangeError("Index out of range");
        }
    }

    // Remove all items that match a predicate
    removeAll(predicate: (item: T) => boolean): number {
        const originalLength = this.items.length;
        this.items = this.items.filter(item => !predicate(item));
        return originalLength - this.items.length;
    }

    // Find an item matching a predicate
    find(predicate: (item: T) => boolean): T | undefined {
        return this.items.find(predicate);
    }

    // Find the index of an item matching a predicate
    findIndex(predicate: (item: T) => boolean): number {
        return this.items.findIndex(predicate);
    }

    // Check if the list contains an item
    contains(item: T): boolean {
        return this.items.includes(item);
    }

    // Get the item at a specific index
    get(index: number): T {
        if (index >= 0 && index < this.items.length) {
            return this.items[index];
        }
        throw new RangeError("Index out of range");
    }

    // Clear all items in the list
    clear(): void {
        this.items = [];
    }

    // Get the number of items in the list
    get count(): number {
        return this.items.length;
    }

    // Convert to an array
    toArray(): T[] {
        return [...this.items];
    }

    // Sort the list in place
    sort(comparator?: (a: T, b: T) => number): void {
        this.items.sort(comparator);
    }

    // Reverse the list in place
    reverse(): void {
        this.items.reverse();
    }
}
