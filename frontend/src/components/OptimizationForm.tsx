import React from 'react';
import { Trash2, Plus } from 'lucide-react';
import { useForm } from "react-hook-form";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "./ui/form";
import { Input } from "./ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Slider } from "./ui/slider";

interface City extends Array<number> {
    0: number;
    1: number;
  }
  
  interface OptimizationFormData {
    problem_type: 'tsp';
    population_size: number;
    dimension: number;
    mutation_rate: number;
    crossover_rate: number;
    max_generations: number;
    parameters: {
      cities: City[];
    };
  }
  
  interface OptimizationFormProps {
    onSubmit: (data: OptimizationFormData) => void;
    isRunning: boolean;
  }
  
  const OptimizationForm: React.FC<OptimizationFormProps> = ({ onSubmit, isRunning }) => {
    const form = useForm<OptimizationFormData>({
      defaultValues: {
        problem_type: 'tsp',
        population_size: 50,
        dimension: 10,
        mutation_rate: 0.5,
        crossover_rate: 0.8,
        max_generations: 100,
        parameters: {
          cities: [
            [0, 0],
            [1, 3],
            [2, 1],
            [3, 9],
            [5, 3],
          ]
        }
      }
    });
  
    const { watch, setValue } = form;
    const cities = watch('parameters.cities');
  
    const handleCityChange = (index: number, coord: 0 | 1, value: string): void => {
      const newCities = [...cities];
      newCities[index][coord] = Number(value);
      setValue('parameters.cities', newCities);
      setValue('dimension', newCities.length);
    };
  
    const addCity = (): void => {
      
      const newCities = [...cities, [0, 0] as City];
      setValue('parameters.cities', newCities);
      setValue('dimension', newCities.length);
    };
  
    const removeCity = (index: number): void => {
      const newCities = cities.filter((_, i) => i !== index);
      setValue('parameters.cities', newCities);
      setValue('dimension', newCities.length);
    };
  
    return (
      <Card>
        <CardHeader>
          <CardTitle>Optimization Parameters</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="population_size"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Population Size</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={10}
                          max={1000}
                          {...field}
                          onChange={e => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
  
                <FormField
                  control={form.control}
                  name="mutation_rate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Mutation Rate ({(field.value * 100).toFixed(1)}%)
                      </FormLabel>
                      <FormControl>
                        <Slider
                          value={[field.value * 100]}
                          onValueChange={(value) => field.onChange(value[0] / 100)}
                          min={0}
                          max={100}
                          step={1}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
  
                <FormField
                  control={form.control}
                  name="crossover_rate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Crossover Rate ({(field.value * 100).toFixed(1)}%)
                      </FormLabel>
                      <FormControl>
                        <Slider
                          value={[field.value * 100]}
                          onValueChange={(value) => field.onChange(value[0] / 100)}
                          min={0}
                          max={100}
                          step={1}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
  
                <FormField
                  control={form.control}
                  name="max_generations"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Generations</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          max={1000}
                          {...field}
                          onChange={e => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
  
                <FormItem>
                  <FormLabel>Cities</FormLabel>
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>X</TableHead>
                          <TableHead>Y</TableHead>
                          <TableHead className="w-16"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {cities.map((city, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <Input
                                type="number"
                                value={city[0]}
                                onChange={(e) => handleCityChange(index, 0, e.target.value)}
                                className="w-24"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                value={city[1]}
                                onChange={(e) => handleCityChange(index, 1, e.target.value)}
                                className="w-24"
                              />
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeCity(index)}
                                disabled={cities.length <= 3}
                                className="h-8 w-8"
                                type="button"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addCity}
                    className="mt-2"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add City
                  </Button>
                </FormItem>
              </div>
  
              <Button 
                type="submit" 
                disabled={isRunning}
                className="w-full"
              >
                Start Optimization
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    );
  };
  
  export default OptimizationForm;