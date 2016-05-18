//
//  Level.swift
//  Rapunzel
//
//  Created by Simon Kemper on 03.05.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

import SpriteKit
import GameplayKit

struct LevelLayer {

    let name: String
    let creationHandler: (CameraComponent) -> LayerEntity
}

class LevelEntity: Entity {

    let renderComponent: RenderComponent
    
    override init() {
        
        renderComponent = RenderComponent()
        super.init()
        renderComponent.node.entity = self
    }
}
