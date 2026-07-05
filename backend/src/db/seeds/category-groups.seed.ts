export default async function categoryGroupsSeed() {
    return [
        {
            name: "Income",
            description: "Income related categories",
            sortOrder: 1,
        },
        {
            name: "Food & Drinks",
            description: "Food, restaurants and beverages",
            sortOrder: 2,
        },
        {
            name: "Transportation",
            description: "Travel and transportation expenses",
            sortOrder: 3,
        },
        {
            name: "Shopping",
            description: "Shopping and retail purchases",
            sortOrder: 4,
        },
        {
            name: "Home",
            description: "Home and household expenses",
            sortOrder: 5,
        },
        {
            name: "Bills & Utilities",
            description: "Monthly bills and utility payments",
            sortOrder: 6,
        },
        {
            name: "Health",
            description: "Healthcare and medical expenses",
            sortOrder: 7,
        },
        {
            name: "Education",
            description: "Education and learning expenses",
            sortOrder: 8,
        },
        {
            name: "Entertainment",
            description: "Movies, games and leisure",
            sortOrder: 9,
        },
        {
            name: "Travel",
            description: "Trips and vacations",
            sortOrder: 10,
        },
        {
            name: "Finance",
            description: "Loans, EMI, taxes and investments",
            sortOrder: 11,
        },
        {
            name: "Personal",
            description: "Personal care and lifestyle",
            sortOrder: 12,
        },
        {
            name: "Others",
            description: "Miscellaneous categories",
            sortOrder: 13,
        },
    ] as const;
}