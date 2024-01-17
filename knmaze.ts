
/**
 * Custom blocks
 */
//% weight=100 color=#0fbc11 icon="\uf11b" block="KN Maze"
namespace knmaze {
    const MASK_NORTH = 8;
    const MASK_SOUTH = 4;
    const MASK_EAST = 2;
    const MASK_WEST = 1;

    let MASK_OPPOSITES = [
        undefined, // 0
        MASK_EAST, // 1 = MASK_WEST
        MASK_WEST, // 2 = MASK_EAST
        undefined, // 3
        MASK_NORTH, // 4 = MASK_SOUTH
        undefined, // 5
        undefined, // 6
        undefined, // 7
        MASK_SOUTH, // 8 = MASK_NORTH
    ];

    let MASK_RIGHT = [
        undefined, // 0
        MASK_NORTH, // 1 = MASK_WEST
        MASK_SOUTH, // 2 = MASK_EAST
        undefined, // 3
        MASK_WEST, // 4 = MASK_SOUTH
        undefined, // 5
        undefined, // 6
        undefined, // 7
        MASK_EAST, // 8 = MASK_NORTH
    ];

    let width = 0;
    let height = 0;
    let maze: number[] = [];
    let position = -1;


    function prepare(): void {
        let size = width * height;
        maze = [];
        for (let i = 0; i < size; i++) {
            maze.push(0);
        }
        position = randomint(size);
    }

    function randomint(max: number) {
        return randint(0, max - 1);
    }
    function shuffleN(array: any[], n: number) {
        // Might be biased, who cares!
        let l = array.length;
        for (let i = l - n; i < l; i++) {
            let j = randomint(i);
            let tmp = array[j];
            array[j] = array[i];
            array[i] = tmp;
        }
        // return array;
    }


    function calculateNeighbours(current: number) {
        let neighbours = [];
        let y = Math.floor(current / width);
        let x = current % width;
        if (y > 0) {
            let north = current - width;
            neighbours.push([north, MASK_NORTH]);
        }
        if (y < height - 1) {
            let south = current + width;
            neighbours.push([south, MASK_SOUTH]);
        }
        if (x < width - 1) {
            let east = current + 1;
            neighbours.push([east, MASK_EAST]);
        }
        if (x > 0) {
            let west = current - 1;
            neighbours.push([west, MASK_WEST])
        }
        return neighbours;
    }



    /**
     * Create a new maze using the "simple" algorithm.
     * @param Width: The width of the maze
     * @param Height: The height of the maze
     */
    //% block="Create simple maze %Width %Height"
    export function createMazeSimple(Width: number, Height: number) {
        width = Width;
        height = Height;
        prepare();
        let current = position;
        let queue = [];
        while (true) {
            let neighbours = calculateNeighbours(current);
            let n = 0;
            for (let pair of neighbours) {
                let [neighbour, mask] = pair;
                if (maze[neighbour] === 0) {
                    queue.push(neighbour);
                    maze[current] |= mask;
                    maze[neighbour] |= MASK_OPPOSITES[mask];
                    n++;
                }
            }
            shuffleN(queue, n);
            current = queue.pop();
            if (current === undefined) {
                break;
            }
        }

        // serial.writeNumber(width)
        // serial.writeNumbers(maze);
    }


    /**
     * Create a new maze using the "depth" algorithm.
     * @param Width: The width of the maze
     * @param Height: The height of the maze
     */
    //% block="Create depth maze %Width %Height"
    export function createMazeDepth(Width: number, Height: number) {
        width = Width;
        height = Height;
        prepare();
        let current = position;
        let stack = [];
        while (true) {
            let neighbours = calculateNeighbours(current);
            shuffleN(neighbours, neighbours.length);
            for (let pair of neighbours) {
                let [neighbour, mask] = pair;
                if (maze[neighbour] === 0) {
                    stack.push(current);
                    maze[current] |= mask;
                    maze[neighbour] |= MASK_OPPOSITES[mask];
                    stack.push(neighbour);
                }
            }
            current = stack.pop()
            if (current === undefined) {
                break;
            }
        }
    }


    /**
     * Create a new maze using the "wilson" algorithm.
     * @param Width: The width of the maze
     * @param Height: The height of the maze
     */
    //% block="Create Wilson maze %Width %Height"
    export function createMazeWilson(Width: number, Height: number) {
        width = Width;
        height = Height;
        prepare();
        let current = position;
        // There needs to be an initial cell in the maze, but as it is not connected we need to just open the walls.
        // We will repair this in the end.
        maze[position] = MASK_NORTH | MASK_SOUTH | MASK_WEST | MASK_EAST;

        let size = width * height;
        for (let start = 0; start < size; start++) {
            if (maze[start] !== 0) {
                continue;
            }
            let current = start;
            let path = [[start, 0]];
            while (true) {
                if (maze[current] !== 0) {
                    // Got back to maze
                    break;
                }
                let neighbours = calculateNeighbours(current);
                let [neighbour, mask] = neighbours[randomint(neighbours.length)];
                path.push([neighbour, mask]);
                // -2 to start at index before the new neighbour
                for (let i = path.length - 2; i >= 0; i--) {
                    if (neighbour === path[i][0]) {
                        while (path.length > (i + 1)) {
                            path.pop();
                        }
                        break;
                    }
                }
                current = neighbour;
            }
            // Connect path
            current = start;
            for (let pair of path) {
                let [neighbour, mask] = pair;
                if (mask === 0) {
                    continue;
                }
                maze[current] |= mask;
                maze[neighbour] |= MASK_OPPOSITES[mask];
                current = neighbour;
            }
        }
        // Repair maze at initial cell
        maze[position] = 0;
        let neighbours = calculateNeighbours(position);
        for (let pair of neighbours) {
            let [neighbour, mask] = pair;
            if (maze[neighbour] & MASK_OPPOSITES[mask]) {
                maze[position] |= mask;
            }
        }
    }


    export enum Direction {
        //% block=north
        North = MASK_NORTH,
        //% block=south
        South = MASK_SOUTH,
        //% block=east
        East = MASK_EAST,
        //% block=west
        West = MASK_WEST,
    }


    /**
     * See if there is a wall in the direction on the current position
     * @param direction: The direction where the wall is
     */
    //% block="Is there a wall to the %direction"
    export function isWall(direction: knmaze.Direction): boolean {
        return !(maze[position] & direction);
    }

    /**
     * Move position in the direction
     * @param direction: The direction to move in
     */
    //% block="Move %direction"
    export function move(direction: knmaze.Direction): void {
        let y = Math.floor(position / width);
        let x = position % width;
        if (direction === MASK_NORTH && y > 0) {
            position -= width;
        } else if (direction === MASK_SOUTH && y < height - 1) {
            position += width;
        } else if (direction === MASK_EAST && x < width - 1) {
            position += 1;
        } else if (direction === MASK_WEST && x > 0) {
            position -= 1;
        }
    }

}
