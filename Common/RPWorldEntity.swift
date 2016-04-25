//
//  RPWorldNode.swift
//  RapunzelSwift
//
//  Created by Simon Kemper on 13.11.15.
//  Copyright © 2015 Simon Kemper. All rights reserved.
//

import SpriteKit
import GameplayKit

struct RPWorldNodeSettings {
    
    static let SmoothingFactor: CGFloat = 4.0
}

class RPWorldEntity: GKEntity {
    
    let renderComponent: RPRenderComponent
    
    override init() {
        
        renderComponent = RPRenderComponent()
        super.init()
        renderComponent.node.entity = self;
        addComponent(renderComponent)
    }
}