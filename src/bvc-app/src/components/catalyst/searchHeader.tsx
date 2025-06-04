import React, { Component } from "react";

export class SectionHeader extends Component {
  render() {
    return (
      <div className="bg-program-gradient">
        <div className="mx-auto max-w-full px-6 lg:px-8">
          <div className="mx-auto max-w-full lg:mx-0">
            <p className="text-9xl gradient-text-blue">
              Get the help you need
            </p>
            <h2 className="mt-2 text-5xl font-semibold tracking-tight text-white sm:text-7xl">
              Find a Program
            </h2>
            <p className="mt-8 text-pretty text-lg font-medium text-gray-500 sm:text-xl/8">
              Anim aute id magna aliqua ad ad non deserunt sunt. Qui irure qui
              lorem cupidatat commodo. Elit sunt amet fugiat veniam occaecat
              fugiat.
            </p>
          </div>
        </div>
      </div>
    );
  }
}

export default SectionHeader;
