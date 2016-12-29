//
//  TreeLayerEntity.swift
//  Rapunzel
//
//  Created by Simon Kemper on 24.02.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

import SpriteKit
import GameplayKit

enum TreePlatformPosition: CGFloat {
    
    case left = -320
    case right = 320
}

class TreeLayerEntity: LayerEntity, ResourceLoadableType {
    
    static var tileSize = CGSize(width: 1364, height: 192)
    static var tileAtlas: SKTextureAtlas!
    static var tileSet: TileSet!
    
    // MARK: - Components
    
    var tileComponent: TileComponent {
        guard let tileComponent = component(ofType: TileComponent.self) else { fatalError() }
        return tileComponent
    }
    
    // MARK: - Initialisation
    
    override init(withParallaxFactor factor: CGFloat = 1.0, cameraComponent: CameraComponent, zPosition: CGFloat = 0.0) {
        
        super.init(withParallaxFactor: factor, cameraComponent: cameraComponent, zPosition: zPosition)
        
        let tileComponent = TileComponent(withEntity: self, tileSet: TreeLayerEntity.tileSet)
        addComponent(tileComponent)

        self.name = "TreeLayerEntity"
    }
    
    required init?(coder aDecoder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
}

extension TreeLayerEntity {
    
    static var resourcesNeedLoading: Bool {
        return tileAtlas == nil
    }
    
    static func loadResources(withCompletionHandler completionHandler: @escaping () -> ()) {
        
        tileAtlas = SKTextureAtlas(named: "RPTreeLayer")
        tileAtlas.preload { () -> Void in
            
            tileSet = TileComponent.tileSetFromAtlas(tileAtlas)
            completionHandler()
        }
    }
    
    static func purgeResources() {
        
        tileAtlas = nil
    }
    
}
