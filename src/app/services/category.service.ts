import { Injectable } from '@angular/core';
import { Category } from '../types/category.types';

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  private readonly categories: Category[] = [
    {
      id: '1',
      name: 'Shopping',
      iconPath: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z',
      iconColor: '#e91e63',
      backgroundColor: '#fce4ec',
    },
    {
      id: '2',
      name: 'Dining',
      iconPath:
        'M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z',
      iconColor: '#2196f3',
      backgroundColor: '#e3f2fd',
    },
    {
      id: '3',
      name: 'Rent',
      iconPath:
        'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z',
      iconColor: '#4caf50',
      backgroundColor: '#e8f5e9',
    },
    {
      id: '4',
      name: 'Transport',
      iconPath:
        'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z',
      iconColor: '#ff9800',
      backgroundColor: '#fff3e0',
    },
    {
      id: '5',
      name: 'Entertainment',
      iconPath:
        'M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z',
      iconColor: '#9c27b0',
      backgroundColor: '#f3e5f5',
    },
    {
      id: '6',
      name: 'Healthcare',
      iconPath: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z',
      iconColor: '#f44336',
      backgroundColor: '#ffebee',
    },
  ];

  public getCategories(): readonly Category[] {
    return this.categories;
  }

  public getCategoryById(id: string): Category | undefined {
    return this.categories.find((category) => category.id === id);
  }

  public searchCategories(query: string): Category[] {
    const normalizedQuery = query.toLowerCase().trim();
    if (!normalizedQuery) {
      return [...this.categories];
    }
    return this.categories.filter((category) =>
      category.name.toLowerCase().includes(normalizedQuery)
    );
  }
}