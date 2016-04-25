//
//  RPDebugOutputComponent.swift
//  Rapunzel
//
//  Created by Simon Kemper on 17.04.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

import GameplayKit
import SpriteKit

class RPDebugOutputComponent: GKComponent {

    weak var renderComponent: RPRenderComponent!
    let name: String
    
    init(withEntity entity: GKEntity, andName name: String) {
        
        /* If entity uses Computed Properties we bypass calling the computation every time by */
        /* calling it once during initialisation and assigning that reference to a weak var */
        
        /* We could also guard that assignment to make sure the entity has a physics component */
        
        guard let renderComponent = entity.componentForClass(RPRenderComponent) else {
            fatalError("Entity has no Physics Component!")
        }
        
        self.renderComponent = renderComponent
        self.name = name
    }
    
    override func updateWithDeltaTime(seconds: NSTimeInterval) {
        super.updateWithDeltaTime(seconds)
        
        print("\(self.name): \(self.renderComponent.node.position.y) Gravity: \(self.renderComponent.node.physicsBody?.velocity.dy)")
    }
}
